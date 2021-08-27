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
		.setName("deletequote")
		.setDescription("Deletes the specified quote")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to delete.")
				.setRequired(true)
		),
	cooldown: 8,
	async execute(interaction) {
		if (
			interaction.member.permissions.has("MANAGE_GUILD") ||
			interaction.client.admins.includes(interaction.user.id)
		) {
			const id = interaction.options.getInteger("id");
			const guild = await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			);
			const serverQuotes = guild.quotes;

			const quote = serverQuotes[id - 1];
			if (quote) {
				await serverQuotes.splice(id - 1, 1);
				await guild.save();

				await interaction.reply({
					content: `✅ **|** Deleted quote #${id}.`,
				});
			} else {
				await interaction.reply({
					content: "❌ **|** I couldn't find a quote with that ID.",
					ephemeral: true,
				});
			}
		} else {
			await interaction.reply({
				content:
					"✋ **|** That action requires the **Manage Guild** permission.",
				ephemeral: true,
			});
		}
	},
};
