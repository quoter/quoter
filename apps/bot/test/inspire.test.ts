import { describe, expect, test } from "bun:test";

import { wrapText } from "@/commands/inspire";

// every character is 1 unit wide
function measure(text: string): number {
  return text.length;
}

describe("wrapText", () => {
  test("breaks lines between words", () => {
    expect(wrapText("the quick brown fox jumps", 10, measure)).toEqual([
      "the quick",
      "brown fox",
      "jumps",
    ]);
  });

  test("keeps punctuation with the word before it", () => {
    expect(wrapText('"one two three."', 9, measure)).toEqual([
      '"one two',
      'three."',
    ]);
  });

  test("collapses whitespace and newlines", () => {
    expect(wrapText("  one\n\ntwo   three ", 100, measure)).toEqual([
      "one two three",
    ]);
  });

  test("gives a word wider than the line its own line", () => {
    expect(wrapText("a extraordinarily b", 5, measure)).toEqual([
      "a",
      "extraordinarily",
      "b",
    ]);
  });

  test("breaks text without spaces between words", () => {
    const lines = wrapText("今天天气很好我们一起去公园散步吧", 6, measure);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join("")).toBe("今天天气很好我们一起去公园散步吧");
    for (const line of lines) {
      expect(line).not.toContain(" ");
    }
  });
});
