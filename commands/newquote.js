/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

const mentionParse = async (mention, client) => {
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

module.exports = {
	enabled: true,
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
		if (
			db.get(`${message.guild.id}.allquote`) ||
			message.member.permissions.has("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];
			if (
				serverQuotes.length >=
				(db.get(`${message.guild.id}.maxQuotes`) || 75)
			) {
				return await message.channel.send(
					`❌ **|** This server has too many quotes! Use \`${message.applicablePrefix}deletequote\` before creating more.`
				);
			}

			const quoteArgs = args.join(" ").split("-");
			let author;

			if (quoteArgs.length > 1) {
				author = await mentionParse(quoteArgs.pop(), message.client);
			}

			if (
				author &&
				(author.trim().toLowerCase() === "anon" ||
					author.trim().toLowerCase() === "anonymous")
			) {
				author = undefined;
			}

			const quote = quoteArgs.join("-").trim();

			if (
				quote.length >
				(db.get(`${message.guild.id}.maxQuoteSize`) || 130)
			) {
				return await message.channel.send(
					`❌ **|** Quotes cannot be longer than ${
						db.get(`${message.guild.id}.maxQuoteSize`) || 130
					} characters.`
				);
			}

			db.push(`${message.guild.id}.quotes`, {
				text: quote,
				author: author,
				createdTimestamp: Date.now(),
				quoter: message.author.id,
			});

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Added quote")
				.setColor(config.colors.success)
				.setDescription(
					`Created a new server quote:

"${quote}"${author ? ` - ${author}` : ""}`
				)
				.setFooter(`Quote #${(serverQuotes.length || 0) + 1}`);
			await message.channel.send(successEmbed);
		} else {
			await message.channel.send(
				`✋ **|** That action requires the **Manage Guild** permission.

**❗ To allow anyone to create quotes**, use \`${message.applicablePrefix}allquote\`.`
			);
		}
	},
};
