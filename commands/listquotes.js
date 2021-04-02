/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "listquotes",
	description: "Lists all of the server's quotes",
	usage: "[Page #]",
	example: "",
	aliases: ["quotelist", "quotes", "lq"],
	cooldown: 8,
	args: false,
	guildOnly: true,
	supportGuildOnly: false,
	async execute(message, args) {
		const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];

		if (!serverQuotes.length) {
			const noQuotesEmbed = new Discord.MessageEmbed()
				.setTitle("❌ No quotes found")
				.setColor(config.colors.error)
				.setDescription(
					`This server doesn't have any quotes, use \`${message.applicablePrefix}newquote\` to add some!`
				);
			return await message.channel.send(noQuotesEmbed);
		}

		const page = Math.floor(Number(args[0])) || 1;
		const maxPageNum = Math.ceil(serverQuotes.length / 10);
		if (isNaN(page) || page <= 0 || page > maxPageNum) {
			const invalidPageEmbed = new Discord.MessageEmbed()
				.setTitle("❌ Invalid page number")
				.setColor(config.colors.error)
				.setDescription(
					`Use a valid integer between **1** and **${maxPageNum}**.`
				);
			return await message.channel.send(invalidPageEmbed);
		}

		const splicedQuotes = serverQuotes.splice((page - 1) * 10, 10);

		let quoteList = "";
		let quoteNumber = 1;
		splicedQuotes.forEach((quote) => {
			if (quote.text && quote.text.length > 30) {
				quote.text = `${quote.text.substr(0, 30)}...`;
			}
			if (quote.author && quote.author.length > 10) {
				quote.author = `${quote.author.substr(0, 10)}...`;
			}

			quoteList += `**${quoteNumber + (page - 1) * 10}**. "${
				quote.text || "An error occurred"
			}"`;
			quoteNumber++;

			if (quote.author && quote.author.length > 0) {
				quoteList += ` - ${quote.author}`;
			}

			quoteList += "\n";
		});

		const quoteListEmbed = new Discord.MessageEmbed()
			.setTitle(`Server Quotes • Page #${page}`)
			.setColor(config.colors.general)
			.setDescription(`Quotes might've shortened due to Discord limitations. Use \`${message.applicablePrefix}quote <ID>\` to get a specific quote, or use \`${message.applicablePrefix}listquotes [#]\` to see other pages.

${quoteList}`);
		await message.channel.send(quoteListEmbed);
	},
};
