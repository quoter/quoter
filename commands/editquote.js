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

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const Guild = require("../schemas/guild.js");
const mentionParse = require("../util/mentionParse.js");
const cleanString = require("../util/cleanString.js");
const { maxQuoteLength } = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("editquote")
		.setDescription("Edits the specified quote.")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to edit.")
				.setRequired(true)
		)
		.addStringOption((o) =>
			o
				.setName("text")
				.setDescription("The quote's new text.")
				.setRequired(true)
		)
		.addStringOption((o) =>
			o.setName("author").setDescription("The quote's new author.")
		),
	cooldown: 10,
	guildOnly: true,
	permission: "manageSelf",
	async execute(interaction) {
		const quoteID = interaction.options.getInteger("id");

		const guild =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		const { quotes } = guild;
		const quote = quotes[quoteID - 1];

		if (!quote) {
			return await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
		}

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author);

		const text = interaction.options.getString("text");

		if (text.length > (guild.maxQuoteLength || maxQuoteLength || 130)) {
			return await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${
					guild.maxQuoteLength || maxQuoteLength || 130
				} characters.`,
				ephemeral: true,
			});
		}

		await quotes.set(quoteID - 1, {
			text,
			author,
			createdTimestamp: quote.createdTimestamp,
			editedTimestamp: Date.now(),
			quoterID: quote.quoterID,
			editorID: interaction.user.id,
		});

		await guild.save();

		await interaction.reply({
			embeds: [
				new MessageEmbed()
					.setTitle("✅ Edited quote")
					.setColor("GREEN")
					.setDescription(
						`"${cleanString(text, false)}"${
							author ? ` - ${cleanString(author, false)}` : ""
						}`
					)
					.setFooter(`Quote #${quoteID}`),
			],
		});
	},
};
