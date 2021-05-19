/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const { MessageEmbed } = require("discord.js");
const Fuse = require("fuse.js");
const db = require("quick.db");

const { colors } = require("../config.json");

module.exports = {
	hidden: false,
	name: "search",
	description: "Searches through the server's quotes.",
	usage: "<Search Term>",
	example: "",
	aliases: ["searchquotes", "s"],
	cooldown: 5,
	args: true,
	guildOnly: true,
	async execute(message, args) {
		const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];

		if (!serverQuotes.length) {
			return await message.channel.send(
				`❌ **|** This server doesn't have any quotes, use \`${message.prefix}newquote\` to add some!`
			);
		}

		const searchTerm = args.join(" ").toLowerCase();

		if (searchTerm.length < 3) {
			return await message.channel.send(
				"❌ **|** That search term is too short! It should be at least 3 characters long."
			);
		}

		const fuse = new Fuse(serverQuotes, {
			keys: ["text", "author"],
		});

		const matches = fuse.search(searchTerm);

		if (!matches.length) {
			return await message.channel.send(
				"❌ **|** There weren't any quotes that matched that search term."
			);
		}

		matches.length = 5;

		const list = matches.map((match) => {
			let result = "";

			const quoteID = match.refIndex + 1;
			const quote = match.item;

			if (quote.text && quote.text.length > 30) {
				quote.text = `${quote.text.substr(0, 30)}...`;
			}
			if (quote.author && quote.author.length > 10) {
				quote.author = `${quote.author.substr(0, 10)}...`;
			}

			result += `**${quoteID}**. "${quote.text || "An error occurred"}"`;

			if (quote.author && quote.author.length > 0) {
				result += ` - ${quote.author}`;
			}

			return result;
		});

		const quoteListEmbed = new MessageEmbed()
			.setTitle("🔎 Search Results")
			.setColor(colors.general)
			.setDescription(`Quotes might've shortened due to Discord limitations. Use \`${
			message.prefix
		}quote <ID>\` to get a specific quote.

${list.join("\n")}`);

		await message.channel.send(quoteListEmbed);
	},
};
