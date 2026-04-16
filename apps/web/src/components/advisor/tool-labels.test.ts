import { describe, test, expect } from "bun:test";
import { getToolLabel, extractToolName } from "./tool-labels";

describe("getToolLabel", () => {
  test("returns known label for registered tool", () => {
    const label = getToolLabel("searchProducts");
    expect(label.active).toBe("Searching products");
    expect(label.done).toBe("Searched products");
  });

  test("returns fallback for unknown tool", () => {
    const label = getToolLabel("unknownTool");
    expect(label.active).toBe("Running unknownTool");
    expect(label.done).toBe("Ran unknownTool");
  });
});

describe("extractToolName", () => {
  test("extracts name from dynamic-tool part", () => {
    expect(extractToolName({ type: "dynamic-tool", toolName: "searchProducts" })).toBe(
      "searchProducts",
    );
  });

  test("extracts name from tool- prefixed part", () => {
    expect(extractToolName({ type: "tool-searchProducts", toolName: "searchProducts" })).toBe(
      "searchProducts",
    );
  });

  test("falls back to stripping tool- prefix when no toolName", () => {
    expect(extractToolName({ type: "tool-myTool" })).toBe("myTool");
  });

  test("returns null for text part", () => {
    expect(extractToolName({ type: "text" })).toBeNull();
  });

  test("returns null for reasoning part", () => {
    expect(extractToolName({ type: "reasoning" })).toBeNull();
  });

  test("returns null for dynamic-tool without toolName", () => {
    expect(extractToolName({ type: "dynamic-tool" })).toBeNull();
  });
});
