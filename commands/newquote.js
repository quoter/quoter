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

const { EmbedBuilder, SlashCommandBuilder, Colors } = require("discord.js");
const Guild = require("../schemas/guild.js");
const mentionParse = require("../util/mentionParse.js");
const trimQuotes = require("../util/trimQuotes.js");
const cleanString = require("../util/cleanString.js");
const { maxGuildQuotes, maxQuoteLength } = require("../config.json");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("newquote")
		.setDescription("Creates a new quote.")
		.addStringOption((o) =>
			o
				.setName("text")
				.setDescription("The quote's text.")
				.setRequired(true)
		)
		.addStringOption((o) =>
			o.setName("author").setDescription("The quote's author.")
		),
	cooldown: 10,
	guildOnly: true,
	permission: "create",
	async execute(interaction) {
		const guild =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		const serverQuotes = guild.quotes;

		if (
			serverQuotes.length >=
			(guild.maxGuildQuotes || maxGuildQuotes || 75)
		) {
			return await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Ask for this limit to be raised in the [Quoter support server](https://discord.gg/QzXTgS2CNk), or use `/deletequote` before creating more.",
				ephemeral: true,
			});
		}

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author, interaction.client);

		const text = trimQuotes(interaction.options.getString("text"));

		if (text.length > (guild.maxQuoteLength || maxQuoteLength || 130)) {
			return await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${
					guild.maxQuoteLength || maxQuoteLength || 130
				} characters.`,
				ephemeral: true,
			});
		}

		await serverQuotes.push({
			text,
			author,
			quoterID: interaction.user.id,
		});

		await guild.save();

		const embed = new EmbedBuilder()
			.setTitle("✅ Created a new quote")
			.setColor(Colors.Green)
			.setDescription(`"${cleanString(text, false)}"`)
			.setFooter({ text: `Quote #${serverQuotes.length}` });

		if (author) {
			embed.setDescription(
				embed.data.description + ` - ${cleanString(author)}`
			);
		}

		await interaction.reply({ embeds: [embed] });
	},
};
