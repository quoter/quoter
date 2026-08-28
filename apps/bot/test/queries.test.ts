import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	closeDatabase,
	countAllQuotes,
	countGuildQuotes,
	createQuote,
	deleteGuildsNotSeenSince,
	deleteQuote,
	ensureGuild,
	GuildQuoteLimitError,
	getGuildSettings,
	getQuote,
	getRandomQuote,
	getSchemaVersion,
	getSearchCandidates,
	importQuotes,
	initializeDatabase,
	listQuotes,
	setGuildLimits,
} from "@/db";

beforeEach(() => {
	initializeDatabase();
});

afterEach(() => {
	closeDatabase();
});

describe("schema", () => {
	test("migrates a new database once", () => {
		expect(getSchemaVersion()).toBe(1);
		expect(getSchemaVersion()).toBe(1);
	});
});

describe("stable quote numbers", () => {
	test("does not reuse a deleted number", () => {
		const first = createQuote("guild", { text: "first" }, 100);
		const second = createQuote("guild", { text: "second" }, 100);

		expect(first.quoteNumber).toBe(1);
		expect(second.quoteNumber).toBe(2);
		expect(deleteQuote("guild", 1)).toBeTrue();

		const third = createQuote("guild", { text: "third" }, 100);
		expect(third.quoteNumber).toBe(3);
		expect(getQuote("guild", 2)?.text).toBe("second");
	});

	test("allocates consecutive numbers for an import", () => {
		createQuote("guild", { text: "existing" }, 100);
		const imported = importQuotes(
			"guild",
			[{ text: "one" }, { text: "two" }],
			100,
		);

		expect(imported.map(({ quoteNumber }) => quoteNumber)).toEqual([2, 3]);
	});
});

describe("limits and transactions", () => {
	test("enforces a custom guild quote limit", () => {
		setGuildLimits("guild", { maxQuotes: 1 });
		createQuote("guild", { text: "first" }, 100);

		expect(() => createQuote("guild", { text: "second" }, 100)).toThrow(
			GuildQuoteLimitError,
		);
	});

	test("rolls back an import that exceeds the limit", () => {
		expect(() =>
			importQuotes("guild", [{ text: "one" }, { text: "two" }], 1),
		).toThrow(GuildQuoteLimitError);
		expect(countGuildQuotes("guild")).toBe(0);
		expect(getGuildSettings("guild")).toBeNull();
	});
});

describe("queries", () => {
	test("paginates across gaps without changing numbers", () => {
		for (let index = 0; index < 12; index++) {
			createQuote("guild", { text: `quote ${index + 1}` }, 100);
		}
		deleteQuote("guild", 2);

		const page = listQuotes("guild", 2, 10);
		expect(page.total).toBe(11);
		expect(page.totalPages).toBe(2);
		expect(page.quotes.map(({ quoteNumber }) => quoteNumber)).toEqual([12]);
	});

	test("filters authors without case sensitivity", () => {
		createQuote("guild", { text: "one", author: "Nick" }, 100);
		createQuote("guild", { text: "two", author: "Someone" }, 100);

		expect(getRandomQuote("guild", "nick")?.author).toBe("Nick");
	});

	test("returns only searchable quote fields", () => {
		createQuote(
			"guild",
			{ text: "hello", author: "world", quoterId: "secret" },
			100,
		);

		expect(getSearchCandidates("guild")).toEqual([
			{ quoteNumber: 1, text: "hello", author: "world" },
		]);
	});
});

describe("guild retention", () => {
	test("deletes only guilds older than the cutoff", () => {
		createQuote("old", { text: "old" }, 100);
		ensureGuild("old", 1_000);
		ensureGuild("current", 2_000);

		expect(deleteGuildsNotSeenSince(1_500)).toBe(1);
		expect(getGuildSettings("old")).toBeNull();
		expect(countAllQuotes()).toBe(0);
		expect(getGuildSettings("current")).not.toBeNull();
	});
});
