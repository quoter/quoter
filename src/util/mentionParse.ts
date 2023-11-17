/*
Copyright (C) 2020-2023 Nick Oates

This file is part of Quoter.

Quoter is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.

Quoter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Quoter.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Client } from "discord.js";

/**
 * Resolves a mention to a user tag.
 * @param mention - The mention to parse.
 * @param client - Discord.js client, used to fetch users.
 * @returns A promise that resolves to the user's tag (if the ID was valid), or a shortened version of the original string.
 */
export default async function mentionParse(mention: string, client: Client) {
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
