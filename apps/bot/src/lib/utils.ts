import type { Client } from "discord.js";

/**
 * Removes hyperlinks & (optionally) newlines from a string
 * @param string The string to clean
 * @param replaceNewlines Whether to replace newlines with spaces
 * @returns The cleaned string
 */
export function cleanString(
  string: string,
  replaceNewlines = true
): string {
  let cleaned = string;

  cleaned = cleaned.replaceAll("\\", "\\\\");
  cleaned = cleaned.replaceAll("[", "\\[");
  if (replaceNewlines) {
    cleaned = cleaned.replaceAll("\n", " ");
  }

  return cleaned;
}

/**
 * Resolves a mention to a user tag.
 * @param mention - The mention to parse.
 * @param client - Discord.js client, used to fetch users.
 * @returns A promise that resolves to the user's tag (if the ID was valid), or a shortened version of the original string.
 */
export async function mentionParse(mention: string, client: Client) {
  let cleanedMention = mention.trim();

  // Remove mention ID formatting
  if (mention.startsWith("<@") && mention.endsWith(">")) {
    cleanedMention = mention.slice(2, -1);
  }

  // Remove deprecated nickname prefix
  // https://discord.com/developers/docs/reference#message-formatting-formats
  if (mention.startsWith("!")) {
    cleanedMention = cleanedMention.slice(1);
  }

  try {
    const result = await client.users.fetch(cleanedMention);
    return result.tag;
  } catch {
    return mention.slice(0, 32);
  }
}

/**
 * Removes double quotes from the start and end of a string if both are present
 * @param string Text to trim
 * @returns The trimmed string
 */
export function trimQuotes(string: string) {
  if (string.startsWith('"') && string.endsWith('"')) {
    return string.slice(1, -1);
  }

  return string;
}
