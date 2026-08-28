import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
	closeDatabase,
	countAllQuotes,
	getGuildSettings,
	getQuote,
	initializeDatabase,
} from "@/db";
import {
	migrateLegacyDocuments,
	parseLegacyGuild,
} from "@/migration/mongo-to-sqlite";

beforeEach(() => {
	initializeDatabase();
});

afterEach(() => {
	closeDatabase();
});

describe("MongoDB migration", () => {
	test("preserves array positions as stable quote numbers", () => {
		const report = migrateLegacyDocuments(
			[
				{
					_id: "guild",
					maxGuildQuotes: 10,
					maxQuoteLength: 300,
					quotes: [
						{
							text: "first",
							author: "Nick",
							quoterID: "user-1",
							createdTimestamp: 100,
						},
						{
							text: "second",
							editorID: "user-2",
							editedTimestamp: 200,
						},
					],
				},
			],
			1_000,
		);

		expect(report).toMatchObject({ guildCount: 1, quoteCount: 2 });
		expect(getQuote("guild", 1)).toMatchObject({
			quoteNumber: 1,
			text: "first",
			quoterId: "user-1",
			createdAt: 100,
		});
		expect(getQuote("guild", 2)).toMatchObject({
			quoteNumber: 2,
			text: "second",
			editorId: "user-2",
			editedAt: 200,
		});
		expect(getGuildSettings("guild")).toMatchObject({
			nextQuoteNumber: 3,
			maxQuotes: 10,
			maxQuoteLength: 300,
			lastSeenAt: 1_000,
		});
	});

	test("supports empty guilds and Unicode", () => {
		migrateLegacyDocuments([
			{ _id: "empty", quotes: [] },
			{ _id: "unicode", quotes: [{ text: "こんにちは 👋" }] },
		]);
		expect(getGuildSettings("empty")?.nextQuoteNumber).toBe(1);
		expect(getQuote("unicode", 1)?.text).toBe("こんにちは 👋");
	});

	test("rejects malformed source records before writing", () => {
		expect(() =>
			parseLegacyGuild({ _id: "guild", quotes: [{ author: "missing text" }] }),
		).toThrow();
		expect(countAllQuotes()).toBe(0);
	});
});
