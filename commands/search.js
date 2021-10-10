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
const { MessageEmbed } = require("discord.js");
const Fuse = require("fuse.js");
const Guild = require("../schemas/guild.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("search")
		.setDescription("Search through the server's quotes.")
		.addStringOption((o) =>
			o
				.setName("term")
				.setDescription("The text to search for.")
				.setRequired(true)
		),
	cooldown: 5,
	guildOnly: true,
	async execute(interaction) {
		const { quotes } =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		if (!quotes.length) {
			return await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes, use `/newquote` to add some!",
				ephemeral: true,
			});
		}

		const searchTerm = interaction.options.getString("term");

		if (searchTerm.length < 3) {
			return await interaction.reply({
				content:
					"❌ **|** That search term is too short! It should be at least 3 characters long.",
				ephemeral: true,
			});
		}

		const fuse = new Fuse(quotes, {
			keys: ["text", "author"],
		});
		const matches = fuse.search(searchTerm);

		if (!matches.length) {
			return await interaction.reply({
				content:
					"❌ **|** There weren't any quotes that matched that search term.",
				ephemeral: true,
			});
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

			result += `**${quoteID}**. "${quote.text}"`;

			if (quote.author && quote.author.length > 0) {
				result += ` - ${quote.author}`;
			}

			return result;
		});

		const quoteListEmbed = new MessageEmbed()
			.setTitle("🔎 Search Results")
			.setColor("BLUE")
			.setDescription(`Use \`/quote <ID>\` to view a specific quote.

${list.join("\n")}`);
		await interaction.reply({ embeds: [quoteListEmbed] });
	},
};
