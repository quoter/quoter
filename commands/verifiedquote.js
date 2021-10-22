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
const Guild = require("../schemas/guild.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("verifiedquote")
		.setDescription("Toggles whether members can use the /newquote command or be limited to the quotethis context menu."),
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

		guild.verifiedQuotes = !guild.verifiedQuotes;
		await guild.save();

		if (guild.verifiedQuotes) {
			await interaction.reply({
				content: "✅ **|** Members will now have to use the quotethis context menu.",
			});
		} else {
			await interaction.reply({
				content: "✅ **|** Everyone can now use the /newquote command.",
			});
		}
	},
};
