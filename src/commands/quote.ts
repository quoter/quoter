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
	SlashCommandBuilder,
	Colors,
	ChatInputCommandInteraction,
} from "discord.js";
import cleanString from "../util/cleanString.js";
import QuoterCommand from "../QuoterCommand.js";
import fetchDbGuild from "../util/fetchDbGuild.js";

const QuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("quote")
		.setDescription("Views a specific quote, otherwise shows a random one.")
		.addIntegerOption((o) =>
			o.setName("id").setDescription("The ID of the quote to view."),
		)
		.addStringOption((o) =>
			o
				.setName("author")
				.setDescription(
					"An author to randomly select a quote from (case-insensitive).",
				),
		)
		.setDMPermission(false),
	cooldown: 2,
	async execute(interaction: ChatInputCommandInteraction) {
		const choice = interaction.options.getInteger("id");
		const author = interaction.options.getString("author");

		if (choice && author) {
			await interaction.reply({
				content: "❌ **|** You can't specify both an ID and an author.",
				ephemeral: true,
			});
			return;
		}

		let { quotes } = await fetchDbGuild(interaction);

		if (!quotes?.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes, or has none by that author. Use `/newquote` to add some!",
				ephemeral: true,
			});
			return;
		}

		const filteredQuotes = author
			? quotes.filter(
					(q) =>
						q.author &&
						q.author.toLowerCase() === author.toLowerCase(),
			  )
			: quotes;

		const id = choice ?? Math.ceil(Math.random() * filteredQuotes.length);

		const quote = filteredQuotes[id - 1];
		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setDescription(`"${cleanString(quote.text, false)}"`)
			.setFooter({ text: `Quote #${id}${!choice ? " (random)" : ""}` });

		if (interaction.guild === null) throw new Error("Guild is null");
		if (quote.ogMessageID && quote.ogChannelID) {
			embed.setDescription(
				embed.data.description +
					`\n> [Original Message](https://discord.com/channels/${interaction.guild.id}/${quote.ogChannelID}/${quote.ogMessageID})`,
			);
		}

		if (quote.createdTimestamp) {
			embed.setTimestamp(quote.editedTimestamp || quote.createdTimestamp);
		}

		if (quote.author) embed.setAuthor({ name: quote.author });

		await interaction.reply({ embeds: [embed] });
	},
};

export default QuoteCommand;
