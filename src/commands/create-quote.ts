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
	EmbedBuilder,
	SlashCommandBuilder,
	Colors,
	ChatInputCommandInteraction,
} from "discord.js";
import mentionParse from "../util/mentionParse";
import trimQuotes from "../util/trimQuotes";
import cleanString from "../util/cleanString";
import { maxGuildQuotes, maxQuoteLength } from "../util/quoteLimits";
import QuoterCommand from "../QuoterCommand";
import fetchDbGuild from "../util/fetchDbGuild";
import { Quote } from "../schemas/guild";

const CreateQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("create-quote")
		.setDescription("Create a new quote in this server's quote book")
		.addStringOption((o) =>
			o
				.setName("text")
				.setDescription("The text of the quote")
				.setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("author").setDescription("The author of the quote"),
		)
		.setDMPermission(false),
	cooldown: 10,
	async execute(interaction: ChatInputCommandInteraction) {
		const guild = await fetchDbGuild(interaction);

		if (guild.quotes.length >= (guild.maxGuildQuotes || maxGuildQuotes)) {
			await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Ask for this limit to be raised in the [Quoter support server](https://discord.gg/QzXTgS2CNk), or use `/delete-quote` before creating more.",
				ephemeral: true,
			});
			return;
		}

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author, interaction.client);

		let text = interaction.options.getString("text");
		if (text === null) throw new Error("Text is null or empty");
		text = trimQuotes(text);

		if (text.length > (guild.maxQuoteLength || maxQuoteLength)) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${
					guild.maxQuoteLength || maxQuoteLength
				} characters.`,
				ephemeral: true,
			});
			return;
		}

		const quote = new Quote({
			text,
			author,
			quoterID: interaction.user.id,
		});

		guild.quotes.push(quote);

		await guild.save();

		const embed = new EmbedBuilder()
			.setTitle("✅ Created a new quote")
			.setColor(Colors.Green)
			.setDescription(`"${cleanString(text, false)}"`)
			.setFooter({ text: `Quote #${guild.quotes.length}` });

		if (author) {
			embed.setDescription(
				embed.data.description + ` - ${cleanString(author)}`,
			);
		}

		await interaction.reply({ embeds: [embed] });
	},
};

export default CreateQuoteCommand;
