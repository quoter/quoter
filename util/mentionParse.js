/*
Copyright (C) 2020-2022 Nicholas Christopher

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

// eslint-disable-next-line no-unused-vars
const { Client } = require("discord.js");

/**
 * Resolves a mention to a user tag.
 * @param {string} mention - The mention to parse.
 * @param {Client} client - A discord.js client, used to fetch users.
 * @returns {Promise<string>} - The user's tag (if the ID was valid), or the shortened original string.
 */
module.exports = async (mention, client) => {
	mention = mention.trim();

	if (mention.startsWith("<@") && mention.endsWith(">")) {
		mention = mention.slice(2, -1);
	}

	if (mention.startsWith("!")) {
		mention = mention.slice(1);
	}

	try {
		const result = await client.users.fetch(mention);
		return result.tag;
	} catch {
		return mention.substr(0, 32);
	}
};
