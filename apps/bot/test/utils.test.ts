import { describe, expect, test } from "bun:test";
import { cleanString, trimQuotes } from "@/lib/utils";

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
