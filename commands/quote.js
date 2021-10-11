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
const Guild = require("../schemas/guild.js");
const cleanString = require("../util/cleanString.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("quote")
		.setDescription("Views a specific quote, otherwise shows a random one.")
		.addIntegerOption((o) =>
			o.setName("id").setDescription("The ID of the quote to view.")
		),
	cooldown: 2,
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

		const id =
			interaction.options.getInteger("id") ||
			Math.floor(Math.random() * quotes.length);

		const quote = quotes[id - 1];
		if (!quote) {
			return await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
		}

		const embed = new MessageEmbed()
			.setColor("BLUE")
			.setDescription(`"${cleanString(quote.text, false)}"`)
			.setFooter(`Quote #${id}`);

		if (quote.ogMessageID && quote.ogChannelID) {
			embed.setDescription(
				embed.description +
					`\n> [Original Message](https://discord.com/channels/${interaction.guild.id}/${quote.ogChannelID}/${quote.ogMessageID})`
			);
		}

		if (quote.createdTimestamp) {
			embed.setTimestamp(quote.editedTimestamp || quote.createdTimestamp);
		}

		if (quote.author) embed.setAuthor(quote.author);

		await interaction.reply({ embeds: [embed] });
	},
};
