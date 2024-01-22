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

import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import QuoterCommand from "../QuoterCommand.js";

const ImportCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("import")
		.setDescription("Import a JSON file to this server's quote book")
		.addAttachmentOption((o) =>
			o
				.setName("file")
				.setDescription("The JSON file to import")
				.setRequired(true),
		)
		.setDMPermission(false)
		.setDefaultMemberPermissions("0"),
	cooldown: 60,
	async execute(interaction: ChatInputCommandInteraction) {
		const attachment = interaction.options.getAttachment("file");
		if (attachment === null) throw new Error("File is null");

		if (attachment.contentType !== "application/json") {
			interaction.reply({
				content: "❌ **|** The file must be a JSON file.",
				ephemeral: true,
			});
			return;
		}

		if (attachment.size > 1024 * 1024 * 2) {
			interaction.reply({
				content:
					"❌ **|** The file cannot be larger than 2 MB. Please split it into multiple files.",
				ephemeral: true,
			});
			return;
		}

		try {
			const resp = await fetch(attachment.url);
			const json = await resp.json();

			// TODO: Validate JSON
			// TODO: Import quotes

			interaction.reply({
				content: "✅ **|** Quotes imported successfully.", // TODO: Return number of quotes imported
				ephemeral: true,
			});
		} catch {
			interaction.reply({
				content:
					"❌ **|** Something went wrong while importing the file. Make sure it is a valid JSON file.",
				ephemeral: true,
			});
			return;
		}
	},
};

export default ImportCommand;
