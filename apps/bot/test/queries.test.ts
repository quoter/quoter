import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import {
  closeDatabase,
  countAllQuotes,
  countGuildQuotes,
  createQuote,
  deleteGuildsLeftBefore,
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
  markGuildLeft,
  reconcileGuilds,
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
      100
    );

    expect(imported.map(({ quoteNumber }) => quoteNumber)).toEqual([2, 3]);
  });
});

describe("limits and transactions", () => {
  test("enforces a custom guild quote limit", () => {
    setGuildLimits("guild", { maxQuotes: 1 });
    createQuote("guild", { text: "first" }, 100);

    expect(() => createQuote("guild", { text: "second" }, 100)).toThrow(
      GuildQuoteLimitError
    );
  });

  test("rolls back an import that exceeds the limit", () => {
    expect(() =>
      importQuotes("guild", [{ text: "one" }, { text: "two" }], 1)
    ).toThrow(GuildQuoteLimitError);
    expect(countGuildQuotes("guild")).toBe(0);
    expect(getGuildSettings("guild")).toBeNull();
  });
});

describe("queries", () => {
  test("paginates across gaps without changing numbers", () => {
    for (let index = 0; index < 12; index += 1) {
      createQuote("guild", { text: `quote ${index + 1}` }, 100);
    }
    deleteQuote("guild", 2);

    const page = listQuotes("guild", 2, 10);
    expect(page.total).toBe(11);
    expect(page.totalPages).toBe(2);
    expect(page.quotes.map(({ quoteNumber }) => quoteNumber)).toEqual([12]);
  });

  test("filters authors without case sensitivity", () => {
    createQuote("guild", { author: "Nick", text: "one" }, 100);
    createQuote("guild", { author: "Someone", text: "two" }, 100);

    expect(getRandomQuote("guild", "nick")?.author).toBe("Nick");
  });

  test("returns only searchable quote fields", () => {
    createQuote(
      "guild",
      { author: "world", quoterId: "secret", text: "hello" },
      100
    );

    expect(getSearchCandidates("guild")).toEqual([
      { author: "world", quoteNumber: 1, text: "hello" },
    ]);
  });
});

describe("guild retention", () => {
  test("deletes guilds left before the cutoff, with their quotes", () => {
    createQuote("left", { text: "gone" }, 100);
    markGuildLeft("left", 1000);
    ensureGuild("present", 1000);

    expect(deleteGuildsLeftBefore(1500)).toBe(1);
    expect(getGuildSettings("left")).toBeNull();
    expect(countAllQuotes()).toBe(0);
    expect(getGuildSettings("present")).not.toBeNull();
  });

  test("keeps guilds left after the cutoff", () => {
    ensureGuild("recent", 1000);
    markGuildLeft("recent", 2000);

    expect(deleteGuildsLeftBefore(1500)).toBe(0);
    expect(getGuildSettings("recent")?.leftAt).toBe(2000);
  });

  test("keeps the original time a guild was left", () => {
    ensureGuild("guild", 1000);
    markGuildLeft("guild", 2000);
    markGuildLeft("guild", 3000);

    expect(getGuildSettings("guild")?.leftAt).toBe(2000);
  });

  test("clears the mark when Quoter is added back", () => {
    ensureGuild("guild", 1000);
    markGuildLeft("guild", 2000);
    ensureGuild("guild", 3000);

    expect(getGuildSettings("guild")?.leftAt).toBeNull();
    expect(deleteGuildsLeftBefore(Number.MAX_SAFE_INTEGER)).toBe(0);
  });

  test("reconciles guilds joined and left while offline", () => {
    ensureGuild("stayed", 1000);
    ensureGuild("removed", 1000);
    ensureGuild("readded", 1000);
    markGuildLeft("readded", 1500);

    expect(reconcileGuilds(["stayed", "readded", "joined"], 2000)).toBe(1);

    expect(getGuildSettings("stayed")?.leftAt).toBeNull();
    expect(getGuildSettings("removed")?.leftAt).toBe(2000);
    expect(getGuildSettings("readded")?.leftAt).toBeNull();
    expect(getGuildSettings("joined")?.createdAt).toBe(2000);
  });

  test("keeps the original time when reconciling an already left guild", () => {
    ensureGuild("guild", 1000);
    markGuildLeft("guild", 1500);

    expect(reconcileGuilds([], 2000)).toBe(0);

    expect(getGuildSettings("guild")?.leftAt).toBe(1500);
  });
});
