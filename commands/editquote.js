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

const mentionParse = require("../util/mentionParse.js");

const { maxQuoteLength } = require("../config.json");

module.exports = {
	hidden: false,
	name: "editquote",
	description: "Edits the specified quote",
	usage: "<Quote ID> <Text> [- <Author>]",
	example: "",
	aliases: ["equote", "quoteedit"],
	cooldown: 10,
	args: true,
	guildOnly: true,
	async execute(message, args) {
		if (
			message.member.permissions.has("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			if (args.length < 2) {
				return await message.channel.send(
					"❌ **|** Incorrect usage. Specify an existing quote ID & it's new content."
				);
			}

			const quoteID = args.shift();

			const guild = await Guild.findOneAndUpdate(
				{ _id: message.guild.id },
				{},
				{ upsert: true, new: true }
			);

			const serverQuotes = guild.quotes;
			const quote = serverQuotes[quoteID - 1];

			if (!quote) {
				return await message.channel.send(
					"❌ **|** I couldn't find a quote with that ID."
				);
			}

			const quoteArgs = args.join(" ").split("-");
			let editedAuthor;

			if (quoteArgs.length > 1) {
				editedAuthor = await mentionParse(
					quoteArgs.pop(),
					message.client
				);
			}

			if (
				["anonymous", "anon"].includes(
					editedAuthor?.trim?.()?.toLowerCase?.()
				)
			) {
				editedAuthor = undefined;
			}

			const editedText = quoteArgs.join("-").trim();

			if (
				editedText.length >
				(guild.maxQuoteLength || maxQuoteLength || 130)
			) {
				return await message.channel.send(
					`❌ **|** Quotes cannot be longer than ${
						guild.maxQuoteLength || maxQuoteLength || 130
					} characters.`
				);
			}

			await serverQuotes.set(quoteID - 1, {
				text: editedText,
				author: editedAuthor,
				createdTimestamp: quote.createdTimestamp,
				editedTimestamp: Date.now(),
				quoterID: quote.quoterID,
				editorID: message.author.id,
			});

			await guild.save();

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Edited quote")
				.setColor("GREEN")
				.setDescription(
					`"${editedText}"${editedAuthor ? ` - ${editedAuthor}` : ""}`
				)
				.setFooter(`Quote #${quoteID}`);
			await message.channel.send(successEmbed);
		} else {
			await message.channel.send(
				"✋ **|** That action requires the **Manage Guild** permission."
			);
		}
	},
};
