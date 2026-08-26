import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { GuildQuoteLimitError, QuoteStore } from "@/db";

let store: QuoteStore;

beforeEach(() => {
	store = new QuoteStore();
});

afterEach(() => {
	store.close();
});

describe("schema", () => {
	test("migrates a new database once", () => {
		expect(store.getSchemaVersion()).toBe(1);
		expect(store.getSchemaVersion()).toBe(1);
	});
});

describe("stable quote numbers", () => {
	test("does not reuse a deleted number", () => {
		const first = store.createQuote("guild", { text: "first" }, 100);
		const second = store.createQuote("guild", { text: "second" }, 100);

		expect(first.quoteNumber).toBe(1);
		expect(second.quoteNumber).toBe(2);
		expect(store.deleteQuote("guild", 1)).toBeTrue();

		const third = store.createQuote("guild", { text: "third" }, 100);
		expect(third.quoteNumber).toBe(3);
		expect(store.getQuote("guild", 2)?.text).toBe("second");
	});

	test("allocates consecutive numbers for an import", () => {
		store.createQuote("guild", { text: "existing" }, 100);
		const imported = store.importQuotes(
			"guild",
			[{ text: "one" }, { text: "two" }],
			100,
		);

		expect(imported.map(({ quoteNumber }) => quoteNumber)).toEqual([2, 3]);
	});
});

describe("limits and transactions", () => {
	test("enforces a custom guild quote limit", () => {
		store.setGuildLimits("guild", { maxQuotes: 1 });
		store.createQuote("guild", { text: "first" }, 100);

		expect(() => store.createQuote("guild", { text: "second" }, 100)).toThrow(
			GuildQuoteLimitError,
		);
	});

	test("rolls back an import that exceeds the limit", () => {
		expect(() =>
			store.importQuotes("guild", [{ text: "one" }, { text: "two" }], 1),
		).toThrow(GuildQuoteLimitError);
		expect(store.countGuildQuotes("guild")).toBe(0);
		expect(store.getGuildSettings("guild")).toBeNull();
	});
});

describe("queries", () => {
	test("paginates across gaps without changing numbers", () => {
		for (let index = 0; index < 12; index++) {
			store.createQuote("guild", { text: `quote ${index + 1}` }, 100);
		}
		store.deleteQuote("guild", 2);

		const page = store.listQuotes("guild", 2, 10);
		expect(page.total).toBe(11);
		expect(page.totalPages).toBe(2);
		expect(page.quotes.map(({ quoteNumber }) => quoteNumber)).toEqual([12]);
	});

	test("filters authors without case sensitivity", () => {
		store.createQuote("guild", { text: "one", author: "Nick" }, 100);
		store.createQuote("guild", { text: "two", author: "Someone" }, 100);

		expect(store.getRandomQuote("guild", "nick")?.author).toBe("Nick");
	});

	test("returns only searchable quote fields", () => {
		store.createQuote(
			"guild",
			{ text: "hello", author: "world", quoterId: "secret" },
			100,
		);

		expect(store.getSearchCandidates("guild")).toEqual([
			{ quoteNumber: 1, text: "hello", author: "world" },
		]);
	});
});

describe("guild retention", () => {
	test("deletes only guilds older than the cutoff", () => {
		store.createQuote("old", { text: "old" }, 100);
		store.ensureGuild("old", 1_000);
		store.ensureGuild("current", 2_000);

		expect(store.deleteGuildsNotSeenSince(1_500)).toBe(1);
		expect(store.getGuildSettings("old")).toBeNull();
		expect(store.countAllQuotes()).toBe(0);
		expect(store.getGuildSettings("current")).not.toBeNull();
	});
});
