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

const { MessageEmbed } = require("discord.js");
const Guild = require("../schemas/guild.js");
const cleanString = require("../util/cleanString.js");
const config = require("../config.json");

module.exports = {
	data: {
		name: "quotethis",
		toJSON() {
			return {
				name: "quotethis",
				type: 3,
				options: [],
				default_permission: undefined,
			};
		},
	},
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
				new MessageEmbed()
					.setTitle("✅ Created a new quote")
					.setColor("GREEN")
					.setDescription(
						`"${cleanString(text, false)}" - ${cleanString(author)}`
					)
					.setFooter(`Quote #${quotes.length} - 1`),
			],
		});
	},
};
