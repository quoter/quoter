// eslint-disable-next-line no-unused-vars
const { Client } = require("discord.js");

/**
 * Resolves a mention to a user tag.
 * @param {string} mention - The mention to parse.
 * @param {Client} client - A discord.js client, used to fetch users.
 * @async
 * @returns {string} - The user's tag (if the ID was valid), or the shortened original string.
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
