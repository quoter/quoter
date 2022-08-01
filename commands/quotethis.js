/*
Copyright (C) 2020-2022 Nicholas Christopher

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

const {
	EmbedBuilder,
	ContextMenuCommandBuilder,
	Colors,
} = require("discord.js");
const Guild = require("../schemas/guild.js");
const cleanString = require("../util/cleanString.js");
const config = require("../config.json");

module.exports = {
	data: new ContextMenuCommandBuilder().setName("Quote This").setType(3),
	cooldown: 10,
	guildOnly: true,
	permission: "create",
	async execute(interaction) {
		const guild =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		const { quotes } = guild;
		const maxGuildQuotes =
			guild.maxGuildQuotes || config.maxGuildQuotes || 75;

		if (quotes.length >= maxGuildQuotes) {
			return await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Use `/deletequote` before creating more.",
				ephemeral: true,
			});
		}

		const message = interaction.options.getMessage("message");

		if (!message.content) {
			return await interaction.reply({
				content: `❌ **|** [That message](${message.url}) doesn't contain text - embeds are not supported!`,
				ephemeral: true,
			});
		}

		const author = message.author?.tag;
		const text = message.content;
		const maxQuoteLength =
			guild.maxQuoteLength || config.maxQuoteLength || 130;

		if (text.length > maxQuoteLength) {
			return await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${maxQuoteLength} characters.`,
				ephemeral: true,
			});
		}

		await quotes.push({
			text,
			author,
			ogMessageID: message.id,
			ogChannelID: message.channel.id,
			quoterID: interaction.user.id,
		});

		await guild.save();

		return await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("✅ Created a new quote")
					.setColor(Colors.Green)
					.setDescription(
						`"${cleanString(text, false)}" - ${cleanString(author)}`
					)
					.setFooter({ text: `Quote #${quotes.length}` }),
			],
		});
	},
};
