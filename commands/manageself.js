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
		.setName("manageself")
		.setDescription(
			"Toggles whether users can delete/edit quotes they created."
		),
	cooldown: 3,
	permission: "manage",
	async execute(interaction) {
		const currentState = (await Guild.findById(interaction.guild.id))
			?.manageSelf;

		await Guild.findOneAndUpdate(
			{ _id: interaction.guild.id },
			{ manageSelf: !currentState },
			{
				upsert: true,
			}
		);

		if (currentState) {
			await interaction.reply({
				content:
					"✅ **|** Users __can no longer__ delete or edit quotes they've created..",
			});
		} else {
			await interaction.reply({
				content:
					"✅ **|** Users __can now__ delete or edit quotes they've created.",
			});
		}
	},
};
