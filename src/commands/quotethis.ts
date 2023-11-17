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

import {
	EmbedBuilder,
	ContextMenuCommandBuilder,
	Colors,
	ApplicationCommandType,
	MessageContextMenuCommandInteraction,
	PermissionFlagsBits,
} from "discord.js";
import cleanString from "../util/cleanString";
import QuoterCommand from "../QuoterCommand";
import fetchDbGuild from "../util/fetchDbGuild";
import { maxGuildQuotes, maxQuoteLength } from "../util/quoteLimits";
import { Quote } from "../schemas/guild";

const QuoteThisCommand: QuoterCommand = {
	data: new ContextMenuCommandBuilder()
		.setName("Quote This")
		.setType(ApplicationCommandType.Message)
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	cooldown: 10,
	async execute(interaction: MessageContextMenuCommandInteraction) {
		const guild = await fetchDbGuild(interaction);

		if (guild.quotes.length >= (guild.maxGuildQuotes || maxGuildQuotes)) {
			await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Ask for this limit to be raised in the [Quoter support server](https://discord.gg/QzXTgS2CNk), or use `/deletequote` before creating more.",
				ephemeral: true,
			});
			return;
		}

		const message = interaction.options.getMessage("message");
		if (!message) throw new Error("No message found");

		const text = message.content;
		if (!text) {
			await interaction.reply({
				content: `❌ **|** [That message](${message.url}) doesn't contain text - embeds are not supported!`,
				ephemeral: true,
			});
			return;
		}

		if (text.length > (guild.maxQuoteLength || maxQuoteLength)) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${maxQuoteLength} characters.`,
				ephemeral: true,
			});
			return;
		}

		const author = message.author?.tag;

		const quote = new Quote({
			text,
			author,
			ogMessageID: message.id,
			ogChannelID: message.channel.id,
			quoterID: interaction.user.id,
		});

		guild.quotes.push(quote);
		await guild.save();

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("✅ Created a new quote")
					.setColor(Colors.Green)
					.setDescription(
						`"${cleanString(text, false)}" - ${cleanString(
							author,
						)}`,
					)
					.setFooter({ text: `Quote #${guild.quotes.length}` }),
			],
		});
	},
};

export default QuoteThisCommand;
