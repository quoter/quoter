import { describe, expect, test } from "bun:test";

import { cleanString, quoteNotFoundMessage, trimQuotes } from "@/lib/utils";

describe("cleanString", () => {
  test("escapes Markdown links and replaces newlines", () => {
    expect(cleanString("[one]\ntwo")).toBe("\\[one] two");
  });

  test("preserves newlines when requested", () => {
    expect(cleanString("one\ntwo", false)).toBe("one\ntwo");
  });
});

describe("trimQuotes", () => {
  test("removes a matching pair of double quotes", () => {
    expect(trimQuotes('"a quote"')).toBe("a quote");
  });

  test("preserves unmatched quotes", () => {
    expect(trimQuotes('"a quote')).toBe('"a quote');
  });
});

describe("quoteNotFoundMessage", () => {
  test("explains a missing ID", () => {
    expect(quoteNotFoundMessage(7, null)).toContain("with that ID");
  });

  test("explains a missing author", () => {
    expect(quoteNotFoundMessage(null, "Nick")).toContain("by that author");
  });

  test("explains an empty quote book", () => {
    expect(quoteNotFoundMessage()).toContain("doesn't have any quotes");
  });
});
