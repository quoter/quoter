import { describe, expect, test } from "bun:test";
import { loadConfig } from "@/config";

describe("configuration", () => {
	test("loads defaults and admin IDs", () => {
		const config = loadConfig({
			DISCORD_TOKEN: "token",
			DISCORD_ADMIN_ID: "one two",
		});

		expect(config.databasePath).toBe("./db/quoter.sqlite");
		expect(config.maxGuildQuotes).toBe(500);
		expect(config.maxQuoteLength).toBe(250);
		expect(config.guildRetentionDays).toBe(30);
		expect(config.discordAdminIds).toEqual(new Set(["one", "two"]));
	});

	test("rejects invalid limits", () => {
		expect(() =>
			loadConfig({ DISCORD_TOKEN: "token", MAX_GUILD_QUOTES: "0" }),
		).toThrow();
	});

	test("requires a Discord token", () => {
		expect(() => loadConfig({})).toThrow();
	});
});
