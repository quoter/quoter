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

import QuoterCommand from "../QuoterCommand";
import {
	ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import fetchDbGuild from "../util/fetchDbGuild.js";

const DeleteQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("deletequote")
		.setDescription("Deletes the specified quote")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to delete.")
				.setRequired(true),
		)
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	cooldown: 5,
	async execute(interaction: ChatInputCommandInteraction) {
		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		const guild = await fetchDbGuild(interaction);
		const quote = guild.quotes[id - 1];

		if (quote) {
			quote.deleteOne();
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
	},
};

export default DeleteQuoteCommand;
