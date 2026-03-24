import { v } from "convex/values";
import { query } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import { components } from "../_generated/api";

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    const paginated = await listUIMessages(ctx, components.agent, args);
    const streams = await syncStreams(ctx, components.agent, args);
    return { ...paginated, streams };
  },
});
