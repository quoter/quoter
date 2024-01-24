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
	SlashCommandBuilder,
	ChatInputCommandInteraction,
	PermissionFlagsBits,
} from "discord.js";
import QuoterCommand from "../QuoterCommand.js";
import { z } from "zod";
import fetchDbGuild from "../util/fetchDbGuild.js";
import { maxGuildQuotes } from "../util/quoteLimits.js";

const ImportSchema = z
	.object({
		text: z
			.string()
			.min(1)
			.max(Number(process.env.MAX_QUOTE_LENGTH) ?? 250)
			.trim(),
		author: z.string().trim().nullish(),
		createdTimestamp: z.number().int().nonnegative().safe().optional(),
		editedTimestamp: z.number().int().nonnegative().safe().optional(),
	})
	.array()
	.nonempty();

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
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	cooldown: 60,
	async execute(interaction: ChatInputCommandInteraction) {
		const attachment = interaction.options.getAttachment("file");
		if (attachment === null) throw new Error("File is null");

		if (!attachment.contentType?.startsWith("application/json")) {
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

		const resp = await fetch(attachment.url);
		const json = await resp.json();
		const parsed = ImportSchema.safeParse(json);

		if (!parsed.success) {
			interaction.reply({
				content:
					"❌ **|** That file is not a valid quote book. Visit [quoter.cc/format](https://quoter.cc/format) for more information.",
				ephemeral: true,
			});
			return;
		}

		const guild = await fetchDbGuild(interaction);

		const maxQuotes = guild.maxGuildQuotes ?? maxGuildQuotes;
		const remaining = maxQuotes - guild.quotes.length;

		if (parsed.data.length > remaining) {
			interaction.reply({
				content: `❌ **|** That file contains too many quotes. You can only have ${maxQuotes} quotes in this server.`,
				ephemeral: true,
			});
			return;
		}

		guild.quotes.push(...parsed.data);
		await guild.save();

		interaction.reply({
			content: `✅ **|** Imported **${parsed.data.length}** quotes.`,
			ephemeral: true,
		});
	},
};

export default ImportCommand;
