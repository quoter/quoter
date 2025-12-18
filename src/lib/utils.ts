import type { Client, CommandInteraction } from "discord.js";
import { Guild } from "@/schemas/guild";

/**
 * Removes hyperlinks & (optionally) newlines from a string
 * @param string The string to clean
 * @param replaceNewlines Whether to replace newlines with spaces
 * @returns The cleaned string
 */
export function cleanString(
	string: string,
	replaceNewlines: boolean = true,
): string {
	if (!string) return string;

	string = string.replaceAll("\\", "\\\\");
	string = string.replaceAll("[", "\\[");
	if (replaceNewlines) string = string.replaceAll("\n", " ");

	return string;
}

export async function fetchDbGuild(interaction: CommandInteraction) {
	if (!interaction.guild) {
		throw new Error("Interaction is not in a guild.");
	}

	return await Guild.findOneAndUpdate(
		{ _id: interaction.guild.id },
		{},
		{ upsert: true, new: true },
	);
}

/**
 * Resolves a mention to a user tag.
 * @param mention - The mention to parse.
 * @param client - Discord.js client, used to fetch users.
 * @returns A promise that resolves to the user's tag (if the ID was valid), or a shortened version of the original string.
 */
export async function mentionParse(mention: string, client: Client) {
	mention = mention.trim();

	// Remove mention ID formatting
	if (mention.startsWith("<@") && mention.endsWith(">")) {
		mention = mention.slice(2, -1);
	}

	// Remove deprecated nickname prefix
	// https://discord.com/developers/docs/reference#message-formatting-formats
	if (mention.startsWith("!")) mention = mention.slice(1);

	try {
		const result = await client.users.fetch(mention);
		return result.tag;
	} catch {
		return mention.substring(0, 32);
	}
}

/**
 * Removes double quotes from the start and end of a string if both are present
 * @param string Text to trim
 * @returns The trimmed string
 */
export function trimQuotes(string: string) {
	if (string.startsWith('"') && string.endsWith('"')) {
		string = string.slice(1, -1);
	}

	return string;
}
