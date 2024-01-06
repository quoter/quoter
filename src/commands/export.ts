/*
Copyright (C) 2020-2024 Nick Oates

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

import {
	AttachmentBuilder,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import QuoterCommand from "../QuoterCommand.js";
import fetchDbGuild from "../util/fetchDbGuild";

const ExportCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("export")
		.setDescription("Export this server's quote book as a JSON file")
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	cooldown: 60,
	async execute(interaction) {
		const { quotes } = await fetchDbGuild(interaction);

		const json = JSON.stringify(
			quotes,
			["text", "author", "createdTimestamp", "editedTimestamp"],
			" ",
		);
		const buffer = Buffer.from(json);
		const attachment = new AttachmentBuilder(buffer, {
			name: "quotes.json",
		});

		await interaction.reply({
			content: "📥 **|** Here are this server's quotes for download.",
			files: [attachment],
			ephemeral: true,
		});
	},
};

export default ExportCommand;
