"use node";

// eval-only entrypoint. NEVER called from the web app. invoked by the
// Promptfoo provider in `packages/eval/src/providers/advisorProvider.ts`,
// which passes `authSecret` matching `CONVEX_EVAL_SECRET` set on this
// Convex deployment.
//
// design notes (see docs/eval-system-plan.md § "the data flow for one eval row"):
//   - non-streaming (`generateText`) — returns the full result blob synchronously
//   - fresh Agent per call so model / instructions / maxSteps come from the
//     per-run config, not from the production shoppingAdvisor singleton
//   - throwaway thread per call, prefixed with "eval:" in the userId so the
//     web app's queries (which scope to a Clerk subject) never see them
//   - DB snapshot captured pre + post run for any productId the agent saw or
//     looked up — `factuality.ts` reads this from metadata.dbSnapshot

import { v } from "convex/values";
import { Agent } from "@convex-dev/agent";
import { action, type ActionCtx } from "../../_generated/server";
import { api, components } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import {
  getProductDetails,
  searchProducts,
  getRecommendations,
  getCartContents,
  getReviewsSummary,
} from "../tools";
import { buildEvalModel } from "./evalModel";
import { resolvePromptVariant } from "./promptVariants";

type SnapshotEntry = { price: number; rating: number };
type Snapshot = Record<string, SnapshotEntry>;

async function snapshotProducts(ctx: ActionCtx, ids: Iterable<string>, into: Snapshot) {
  for (const id of ids) {
    if (into[id]) continue;
    try {
      const p = await ctx.runQuery(api.products.get, { id: id as Id<"products"> });
      if (p) into[id] = { price: p.price, rating: p.rating };
    } catch {
      // product fetch failed — silently skip; the scorer will treat it as
      // un-snapshot-able and not penalise the answer for it.
    }
  }
}

export const runOnce = action({
  args: {
    authSecret: v.string(),
    question: v.string(),
    productId: v.optional(v.string()),
    recentlyViewedIds: v.optional(v.array(v.string())),
    config: v.object({
      modelId: v.string(),
      reasoningEffort: v.union(
        v.literal("none"),
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
      ),
      maxSteps: v.number(),
      promptVariant: v.string(),
      providerOrder: v.optional(v.array(v.string())),
    }),
    sweepLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. auth bypass via env secret — never accept this action without one
    const expected = process.env.CONVEX_EVAL_SECRET;
    if (!expected) {
      throw new Error(
        "CONVEX_EVAL_SECRET is not set on this Convex deployment. " +
          "The eval runner is disabled until it is configured.",
      );
    }
    if (args.authSecret !== expected) {
      throw new Error("invalid eval secret");
    }

    const startedAt = Date.now();

    // 2. pre-run snapshot of any product the eval explicitly referenced
    const dbSnapshot: Snapshot = {};
    const inputIds = [args.productId, ...(args.recentlyViewedIds ?? [])].filter(
      (id): id is string => typeof id === "string" && id.length > 0,
    );
    await snapshotProducts(ctx, inputIds, dbSnapshot);

    // 3. resolve the prompt variant
    const { systemPrompt, fewShots } = resolvePromptVariant(args.config.promptVariant);

    // 4. fresh Agent per call so model/instructions/maxSteps are per-run
    const evalAgent = new Agent(components.agent, {
      name: `eval:${args.config.modelId}:${args.config.reasoningEffort}`,
      languageModel: buildEvalModel({
        modelId: args.config.modelId,
        reasoningEffort: args.config.reasoningEffort,
        providerOrder: args.config.providerOrder,
      }),
      instructions: systemPrompt,
      tools: {
        getProductDetails,
        searchProducts,
        getRecommendations,
        getCartContents,
        getReviewsSummary,
      },
      maxSteps: args.config.maxSteps,
    });

    // 5. throwaway thread, prefix isolates eval threads from production queries
    const evalUserId = `eval:${args.sweepLabel ?? "ad-hoc"}:${startedAt}`;
    const { threadId } = await evalAgent.createThread(ctx, { userId: evalUserId });

    // 6. assemble system context (mirrors the shape of advisor.ts §
    //    assembleContext, but driven by the eval args — the eval has no
    //    real Clerk identity or cart of its own).
    const contextParts: string[] = [];
    if (args.productId) {
      try {
        const p = await ctx.runQuery(api.products.get, {
          id: args.productId as Id<"products">,
        });
        if (p) {
          const desc =
            p.description.length > 200 ? `${p.description.slice(0, 200)}...` : p.description;
          contextParts.push(
            `CURRENT PRODUCT (ID: ${p._id}): ${p.title} by ${p.brand}\n` +
              `Category: ${p.category}${p.subcategory ? ` > ${p.subcategory}` : ""}\n` +
              `Price: $${p.price}\n` +
              `Rating: ${p.rating}/5 (${p.reviewCount} reviews)\n` +
              `${desc}`,
          );
        }
      } catch {
        // product fetch failed, continue without context
      }
    }
    if (args.recentlyViewedIds && args.recentlyViewedIds.length > 0) {
      try {
        const ids = args.recentlyViewedIds.slice(0, 5) as Id<"products">[];
        const products = await ctx.runQuery(api.products.getByIds, { ids });
        const found = products.filter(
          (p): p is NonNullable<typeof p> => p !== null && p !== undefined,
        );
        if (found.length > 0) {
          const recentLine = found
            .map((p) => `${p.title} (ID: ${p._id}, $${p.price}, ${p.category})`)
            .join(", ");
          contextParts.push(`RECENTLY VIEWED: ${recentLine}`);
        }
      } catch {
        // recent views fetch failed, continue
      }
    }

    const contextMessages =
      contextParts.length > 0
        ? [
            {
              role: "system" as const,
              content: `Current user context (use this to give relevant, specific answers):\n\n${contextParts.join("\n\n")}`,
            },
          ]
        : [];

    const messages = [...contextMessages, ...fewShots];

    // 7. generateText (non-streaming) — full result returned synchronously
    const result = await evalAgent.generateText(
      ctx,
      { threadId },
      {
        prompt: args.question,
        messages,
      },
    );

    // 8. post-run snapshot — anything the agent referenced via tool calls
    const referencedIds = new Set<string>(inputIds);
    for (const tc of result.toolCalls ?? []) {
      const callArgs =
        ((tc as { input?: unknown }).input as Record<string, unknown>) ??
        ((tc as { args?: unknown }).args as Record<string, unknown>) ??
        {};
      if (typeof callArgs.productId === "string") {
        referencedIds.add(callArgs.productId);
      }
      if (Array.isArray(callArgs.productIds)) {
        for (const pid of callArgs.productIds) {
          if (typeof pid === "string") referencedIds.add(pid);
        }
      }
    }
    await snapshotProducts(ctx, referencedIds, dbSnapshot);

    const finishedAt = Date.now();

    // 9. flatten steps into a parts array similar to what useUIMessages
    //    exposes — so eval scorers can read the same shape they would in prod
    const parts: unknown[] = [];
    for (const step of result.steps ?? []) {
      if (step.text) parts.push({ type: "text", text: step.text });
      for (const tc of step.toolCalls ?? []) {
        const tcAny = tc as {
          toolName?: string;
          toolCallId?: string;
          input?: unknown;
          args?: unknown;
        };
        parts.push({
          type: "tool-call",
          toolName: tcAny.toolName,
          toolCallId: tcAny.toolCallId,
          args: tcAny.input ?? tcAny.args,
        });
      }
      for (const tr of step.toolResults ?? []) {
        const trAny = tr as {
          toolName?: string;
          toolCallId?: string;
          output?: unknown;
          result?: unknown;
        };
        parts.push({
          type: "tool-result",
          toolName: trAny.toolName,
          toolCallId: trAny.toolCallId,
          result: trAny.output ?? trAny.result,
        });
      }
    }
    if (
      result.text &&
      !parts.some(
        (p) =>
          (p as { type?: string; text?: string }).type === "text" &&
          (p as { text?: string }).text === result.text,
      )
    ) {
      parts.push({ type: "text", text: result.text });
    }

    const usage = result.usage as
      | {
          inputTokens?: number;
          outputTokens?: number;
          reasoningTokens?: number;
          totalTokens?: number;
        }
      | undefined;

    return {
      finalText: result.text,
      parts,
      usage: {
        input: usage?.inputTokens ?? 0,
        output: usage?.outputTokens ?? 0,
        reasoning: usage?.reasoningTokens ?? 0,
        total: usage?.totalTokens ?? 0,
      },
      timings: {
        startedAt,
        firstDeltaAt: startedAt, // generateText is non-streaming
        finishedAt,
        ttftMs: 0,
        totalMs: finishedAt - startedAt,
      },
      dbSnapshot,
      threadId,
      finishReason: result.finishReason ?? "unknown",
      stepsUsed: result.steps?.length ?? 0,
      toolCalls: (result.toolCalls ?? []).map((tc) => {
        const tcAny = tc as {
          toolName?: string;
          toolCallId?: string;
          input?: unknown;
          args?: unknown;
        };
        return {
          toolName: tcAny.toolName,
          toolCallId: tcAny.toolCallId,
          args: tcAny.input ?? tcAny.args,
        };
      }),
    };
  },
});
