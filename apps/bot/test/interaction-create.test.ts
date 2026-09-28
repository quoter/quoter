import { afterEach, beforeEach, expect, spyOn, test } from "bun:test";
import type { Interaction } from "discord.js";
import { closeDatabase, initializeDatabase } from "@/db";
import { interactionCreate } from "@/events/interaction-create";

beforeEach(() => initializeDatabase());
afterEach(() => closeDatabase());

test("reports errors thrown while handling a button", async () => {
	const replies: unknown[] = [];
	const errorLog = spyOn(console, "error").mockImplementation(() => {});
	const interaction = {
		customId: "listquotes_u1p1",
		deferred: false,
		guild: { id: "guild" },
		guildId: "guild",
		isButton: () => true,
		isCommand: () => false,
		isContextMenuCommand: () => false,
		replied: false,
		reply: async (options: unknown) => replies.push(options),
		update: async () => {
			throw new Error("button update failed");
		},
		user: { id: "1" },
	} as unknown as Interaction;

	await interactionCreate(interaction);

	expect(replies).toHaveLength(1);
	expect(replies[0]).toMatchObject({
		content: expect.stringContaining("Something went wrong"),
	});
	expect(errorLog).toHaveBeenCalled();
	errorLog.mockRestore();
});
