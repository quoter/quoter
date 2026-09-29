import { describe, expect, test } from "bun:test";

import { searchQuotes } from "@/lib/search-quotes";

const quotes = [
  { author: "Nick", quoteNumber: 3, text: "The quick brown fox" },
  { author: "Alice", quoteNumber: 8, text: "Something completely different" },
  { author: null, quoteNumber: 12, text: "A slow turtle" },
];

describe("searchQuotes", () => {
  test("tolerates a typo and preserves the stable quote number", () => {
    expect(searchQuotes(quotes, "quik brwn")[0]).toMatchObject({
      quoteNumber: 3,
      text: "The quick brown fox",
    });
  });

  test("searches author names", () => {
    expect(searchQuotes(quotes, "Alyce")[0]?.quoteNumber).toBe(8);
  });

  test("limits results", () => {
    expect(searchQuotes(quotes, "t", 1)).toHaveLength(1);
  });
});
