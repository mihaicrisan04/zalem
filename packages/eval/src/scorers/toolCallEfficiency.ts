// duplicate-call penalty + step-budget usage. operates on the agent's
// captured part array (provider metadata.parts). NOT a hard pass/fail —
// it returns a 0-1 score that contributes to the composite ranking.

type ToolCallPart = { type: "tool-call"; toolName?: string; toolCallId?: string; args?: unknown };

type Context = {
  providerResponse?: {
    metadata?: { parts?: Array<{ type?: string; toolName?: string; args?: unknown }> };
  };
  vars?: { maxAcceptableToolCalls?: number };
};

export default function toolCallEfficiency(_output: string, context: Context) {
  const parts = context.providerResponse?.metadata?.parts ?? [];
  const toolCalls = parts.filter((p): p is ToolCallPart => p.type === "tool-call");

  if (toolCalls.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: "no tool calls — vacuously efficient",
    };
  }

  // dedupe by (toolName, JSON-stringified args)
  const fingerprints = new Set<string>();
  for (const c of toolCalls) {
    fingerprints.add(`${c.toolName}::${JSON.stringify(c.args ?? {})}`);
  }
  const unique = fingerprints.size;
  const total = toolCalls.length;
  const dedupeRatio = unique / total;

  const cap = context.vars?.maxAcceptableToolCalls ?? 6;
  const overBudget = Math.max(0, total - cap);
  const budgetScore = overBudget === 0 ? 1 : Math.max(0, 1 - overBudget / cap);

  // 60% dedupe, 40% budget — duplicates are the dominant failure mode
  const score = 0.6 * dedupeRatio + 0.4 * budgetScore;

  return {
    pass: dedupeRatio >= 0.8 && overBudget === 0,
    score,
    reason: `${total} tool calls (${unique} unique, cap ${cap}); dedupeRatio=${dedupeRatio.toFixed(2)}`,
  };
}
