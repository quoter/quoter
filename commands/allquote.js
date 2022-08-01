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

const { SlashCommandBuilder } = require("discord.js");
const Guild = require("../schemas/guild.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("allquote")
		.setDescription("Toggles whether everyone can create quotes."),
	cooldown: 3,
	guildOnly: true,
	permission: "manage",
	async execute(interaction) {
		const guild =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		guild.allQuote = !guild.allQuote;
		await guild.save();

		if (guild.allQuote) {
			await interaction.reply({
				content: "✅ **|** Everyone can now create quotes.",
			});
		} else {
			await interaction.reply({
				content: "✅ **|** Only server managers can now create quotes.",
			});
		}
	},
};
