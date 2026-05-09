// F1 between the tool names the agent actually called and the row's
// `expectedTools`. replaces Promptfoo's built-in `tool-call-f1` because that
// reads OpenAI-shape `tool_calls` from `output`, while our provider stores
// the trace in `metadata.toolCalls` with our own shape ({ toolName, args }).
//
// also enforces `forbiddenTools` if specified.
//
// scoring:
//   precision = |called ∩ expected| / |called|
//   recall    = |called ∩ expected| / |expected|
//   F1        = 2·P·R / (P + R)
//
// pass requires F1 ≥ threshold AND no forbidden tools called.

type Context = {
  vars?: { expectedTools?: string[] | string; forbiddenTools?: string[] | string };
  providerResponse?: { metadata?: { toolCalls?: Array<{ toolName?: string }> } };
};

const F1_THRESHOLD = 0.8;

// Promptfoo flattens single-element string arrays in vars to a bare string.
// normalise so our scorer always sees `string[]`.
function asArray(v: string[] | string | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export default function expectedToolCoverage(_output: string, context: Context) {
  const expected = new Set(asArray(context.vars?.expectedTools));
  const forbidden = new Set(asArray(context.vars?.forbiddenTools));
  const calledList = (context.providerResponse?.metadata?.toolCalls ?? [])
    .map((c) => c.toolName)
    .filter((n): n is string => typeof n === "string");
  const called = new Set(calledList);

  // forbidden tools are a hard fail regardless of F1
  const forbiddenHit = [...called].filter((t) => forbidden.has(t));
  if (forbiddenHit.length > 0) {
    return {
      pass: false,
      score: 0,
      reason: `forbidden tools were called: ${forbiddenHit.join(", ")}`,
    };
  }

  // empty expected set + empty called set = vacuously perfect (edge_case rows)
  if (expected.size === 0 && called.size === 0) {
    return {
      pass: true,
      score: 1,
      reason: "no tools expected, no tools called",
    };
  }

  // expected = ∅ but agent called tools = perfect precision is impossible
  // since recall is undefined. treat as pass with score = 1 (agent had
  // discretion). only `forbiddenTools` should police the upper bound here.
  if (expected.size === 0) {
    return {
      pass: true,
      score: 1,
      reason: `no expected set; agent called ${[...called].join(", ")}`,
    };
  }

  const intersection = [...expected].filter((t) => called.has(t)).length;
  const precision = called.size === 0 ? 0 : intersection / called.size;
  const recall = intersection / expected.size;
  const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

  const missing = [...expected].filter((t) => !called.has(t));
  const extra = [...called].filter((t) => !expected.has(t));

  return {
    pass: f1 >= F1_THRESHOLD,
    score: f1,
    reason:
      `F1=${f1.toFixed(2)} (P=${precision.toFixed(2)} R=${recall.toFixed(2)})` +
      (missing.length ? `; missing: ${missing.join(", ")}` : "") +
      (extra.length ? `; extra: ${extra.join(", ")}` : ""),
  };
}
