// catches the maxSteps-cutoff bug class: the agent burned its step budget on
// tool calls and never produced a final text part. without this scorer the bug
// is silent — the user just sees an empty response.

type Context = {
  providerResponse?: {
    metadata?: { parts?: Array<{ type?: string; text?: string }> };
  };
};

export default function hasFinalAnswer(output: string, context: Context) {
  const parts = context.providerResponse?.metadata?.parts ?? [];
  const hasNonEmptyText =
    parts.some(
      (p) => p.type === "text" && typeof p.text === "string" && p.text.trim().length > 0,
    ) || output.trim().length > 0;

  return {
    pass: hasNonEmptyText,
    score: hasNonEmptyText ? 1 : 0,
    reason: hasNonEmptyText
      ? "has non-empty final text part"
      : "no final text — likely hit maxSteps before answering",
  };
}
