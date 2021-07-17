/*
Copyright (C) 2020-2021 Nicholas Christopher

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

const Discord = require("discord.js");
const Guild = require("../schemas/guild.js");

module.exports = {
	hidden: false,
	name: "listquotes",
	description: "Lists all of the server's quotes",
	usage: "[Page #]",
	example: "",
	aliases: ["quotelist", "quotes", "lq"],
	cooldown: 8,
	args: false,
	guildOnly: true,
	async execute(message, args) {
		const serverQuotes =
			(await Guild.findById(message.guild.id))?.quotes || [];

		if (!serverQuotes.length) {
			return await message.channel.send(
				`❌ **|** This server doesn't have any quotes, use \`${message.prefix}newquote\` to add some!`
			);
		}

		const page = Math.floor(Number(args[0])) || 1;
		const maxPageNum = Math.ceil(serverQuotes.length / 10);
		if (page <= 0 || page > maxPageNum) {
			return await message.channel.send(
				`❌ **|** That's an invalid page, use a number between **1** and **${maxPageNum}**.`
			);
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
			.setTitle(`Server Quotes • Page #${page} of ${maxPageNum}`)
			.setColor("BLUE")
			.setDescription(`Quotes might've shortened due to Discord limitations. Use \`${message.prefix}quote <ID>\` to get a specific quote, or use \`${message.prefix}listquotes [#]\` to see other pages.

${quoteList}`);
		await message.channel.send(quoteListEmbed);
	},
};
