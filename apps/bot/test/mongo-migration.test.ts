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
          quotes: [
            {
              author: "Nick",
              createdTimestamp: 100,
              quoterID: "user-1",
              text: "first",
            },
            {
              editedTimestamp: 200,
              editorID: "user-2",
              text: "second",
            },
          ],
        },
      ],
      1000
    );

    expect(report).toMatchObject({ guildCount: 1, quoteCount: 2 });
    expect(getQuote("guild", 1)).toMatchObject({
      createdAt: 100,
      quoteNumber: 1,
      quoterId: "user-1",
      text: "first",
    });
    expect(getQuote("guild", 2)).toMatchObject({
      editedAt: 200,
      editorId: "user-2",
      quoteNumber: 2,
      text: "second",
    });
    expect(getGuildSettings("guild")).toMatchObject({
      lastSeenAt: 1000,
      maxQuotes: 10,
      nextQuoteNumber: 3,
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
      parseLegacyGuild({ _id: "guild", quotes: [{ author: "missing text" }] })
    ).toThrow();
    expect(countAllQuotes()).toBe(0);
  });
});
