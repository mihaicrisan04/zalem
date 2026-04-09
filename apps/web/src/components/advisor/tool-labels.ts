export const TOOL_LABELS: Record<string, { active: string; done: string }> = {
  getProductDetails: { active: "Looking up product details", done: "Looked up product details" },
  searchProducts: { active: "Searching products", done: "Searched products" },
  getRecommendations: { active: "Finding recommendations", done: "Found recommendations" },
  getCartContents: { active: "Checking your cart", done: "Checked your cart" },
  getReviewsSummary: { active: "Reading reviews", done: "Read reviews" },
};

export function getToolLabel(toolName: string): { active: string; done: string } {
  return (
    TOOL_LABELS[toolName] ?? {
      active: `Running ${toolName}`,
      done: `Ran ${toolName}`,
    }
  );
}

export function extractToolName(part: { type?: string; toolName?: string }): string | null {
  if (part.type === "dynamic-tool") return part.toolName ?? null;
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.toolName ?? part.type.replace("tool-", "");
  }
  return null;
}
