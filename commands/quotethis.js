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

const Discord = require("discord.js");
const Guild = require("../schemas/guild.js");

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
	async execute(interaction) {
		const guild = await Guild.findOneAndUpdate(
			{ _id: interaction.guild.id },
			{},
			{ upsert: true, new: true }
		);

		if (
			guild.allQuote ||
			interaction.member.permissions.has("MANAGE_GUILD") ||
			interaction.client.admins.get(interaction.user.id)
		) {
			const serverQuotes = guild.quotes;
			const maxGuildQuotes =
				guild.maxGuildQuotes || config.maxGuildQuotes || 75;

			if (serverQuotes.length >= maxGuildQuotes) {
				return await interaction.reply({
					content:
						"❌ **|** This server has too many quotes! Use `/deletequote` before creating more.",
					ephemeral: true,
				});
			}

			const quoteMessage = interaction.options.getMessage("message");

			if (!quoteMessage.content) {
				return await interaction.reply({
					content: `❌ **|** That [message](${quoteMessage.url}) doesn't contain text - embeds are not supported!`,
					ephemeral: true,
				});
			}

			const quoteAuthor = quoteMessage.author?.tag;
			const quoteText = quoteMessage.content;
			const maxQuoteLength =
				guild.maxQuoteLength || config.maxQuoteLength || 130;

			if (quoteText.length > maxQuoteLength) {
				return await interaction.reply({
					content: `❌ **|** Quotes cannot be longer than ${maxQuoteLength} characters.`,
					ephemeral: true,
				});
			}

			await serverQuotes.push({
				text: quoteText,
				author: quoteAuthor,
				ogMessageID: quoteMessage.id,
				ogChannelID: quoteMessage.channel.id,
				quoterID: interaction.user.id,
			});

			await guild.save();

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Added quote")
				.setColor("GREEN")
				.setDescription(
					`Created a new server quote:

"${quoteText}" - ${quoteAuthor}`
				)
				.setFooter(`Quote #${serverQuotes.length}`);
			return await interaction.reply({ embeds: [successEmbed] });
		} else {
			await interaction.reply({
				content: `✋ **|** That action requires the **Manage Guild** permission.

**❗ To allow anyone to create quotes**, use \`/allquote\`.`,
				ephemeral: true,
			});
		}
	},
};
