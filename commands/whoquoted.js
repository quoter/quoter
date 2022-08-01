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

const { EmbedBuilder, SlashCommandBuilder, Colors } = require("discord.js");
const Guild = require("../schemas/guild.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("whoquoted")
		.setDescription("Shows who created a quote.")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to view.")
				.setRequired(true)
		),
	cooldown: 2,
	guildOnly: true,
	async execute(interaction) {
		const { quotes } =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		if (!quotes.length) {
			return await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes, use `/newquote` to add some!",
				ephemeral: true,
			});
		}

		const id = interaction.options.getInteger("id");
		const quote = quotes[id - 1];
		if (!quote) {
			return await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Green)
					.setDescription(
						`Quote #${id} was created by <@${quote.quoterID}>.`
					),
			],
		});
	},
};
