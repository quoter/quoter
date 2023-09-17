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
	EmbedBuilder,
	SlashCommandBuilder,
	Colors,
	ChatInputCommandInteraction,
} from "discord.js";
import Fuse from "fuse.js";
import cleanString from "../util/cleanString.js";
import fetchDbGuild from "../util/fetchDbGuild.js";

const SearchCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("search")
		.setDescription("Search through the server's quotes.")
		.addStringOption((o) =>
			o
				.setName("term")
				.setDescription("The text to search for.")
				.setRequired(true),
		)
		.setDMPermission(false),
	cooldown: 5,
	async execute(interaction: ChatInputCommandInteraction) {
		const { quotes } = await fetchDbGuild(interaction);

		if (!quotes.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes, use `/newquote` to add some!",
				ephemeral: true,
			});
			return;
		}

		const searchTerm = interaction.options.getString("term");
		if (!searchTerm) throw new Error("Search term is empty or null");

		if (searchTerm.length < 3) {
			await interaction.reply({
				content:
					"❌ **|** That search term is too short! It should be at least 3 characters long.",
				ephemeral: true,
			});
			return;
		}

		const fuse = new Fuse(quotes, {
			keys: ["text", "author"],
			threshold: 0.4,
		});
		const matches = fuse.search(searchTerm);

		if (!matches.length) {
			await interaction.reply({
				content:
					"❌ **|** There weren't any quotes that matched that search term.",
				ephemeral: true,
			});
			return;
		}

		matches.length = 5;

		const list = matches.map((match) => {
			let result = "";

			const quoteID = match.refIndex + 1;
			const quote = match.item;

			if (quote.text && quote.text.length > 30) {
				quote.text = `${quote.text.substr(0, 30)}...`;
			}
			if (quote.author && quote.author.length > 10) {
				quote.author = `${quote.author.substr(0, 10)}...`;
			}

			result += `**${quoteID}**. "${cleanString(quote.text)}"`;

			if (quote.author && quote.author.length > 0) {
				result += ` - ${cleanString(quote.author)}`;
			}

			return result;
		});

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("🔎 Search Results")
					.setColor(Colors.Blue)
					.setDescription(`Use \`/quote <ID>\` to view a specific quote.

${list.join("\n")}`),
			],
		});
	},
};

export default SearchCommand;
