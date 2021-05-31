/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const Discord = require("discord.js");
const Guild = require("../schemas/guild.js");

const mentionParse = require("../util/mentionParse.js");

const { maxGuildQuotes, maxQuoteLength } = require("../config.json");

module.exports = {
	hidden: false,
	name: "newquote",
	description: "Creates a new quote",
	usage: "<Text> [- <Author>]",
	example: "You're gonna have a bad time - Sans",
	aliases: ["createquote", "addquote", "nquote"],
	cooldown: 10,
	args: true,
	guildOnly: true,
	async execute(message, args) {
		const guild = await Guild.findOneAndUpdate(
			{ _id: message.guild.id },
			{},
			{ upsert: true, new: true }
		);

		if (
			guild.allQuote ||
			message.member.permissions.has("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			const serverQuotes = guild.quotes;

			if (
				serverQuotes.length >=
				(guild.maxGuildQuotes || maxGuildQuotes || 75)
			) {
				return await message.channel.send(
					`❌ **|** This server has too many quotes! Use \`${message.prefix}deletequote\` before creating more.`
				);
			}

			const quoteArgs = args.join(" ").split("-");
			let author;

			if (quoteArgs.length > 1) {
				author = await mentionParse(quoteArgs.pop(), message.client);
			}

			if (
				["anonymous", "anon"].includes(
					author?.trim?.()?.toLowerCase?.()
				)
			) {
				author = undefined;
			}

			const quote = quoteArgs.join("-").trim();

			if (
				quote.length > (guild.maxQuoteLength || maxQuoteLength || 130)
			) {
				return await message.channel.send(
					`❌ **|** Quotes cannot be longer than ${
						guild.maxQuoteLength || maxQuoteLength || 130
					} characters.`
				);
			}

			await serverQuotes.push({
				text: quote,
				author: author,
				quoterID: message.author.id,
			});

			await guild.save();

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Added quote")
				.setColor("GREEN")
				.setDescription(
					`Created a new server quote:

"${quote}"${author ? ` - ${author}` : ""}`
				)
				.setFooter(`Quote #${serverQuotes.length}`);
			await message.channel.send(successEmbed);
		} else {
			await message.channel.send(
				`✋ **|** That action requires the **Manage Guild** permission.

**❗ To allow anyone to create quotes**, use \`${message.prefix}allquote\`.`
			);
		}
	},
};
