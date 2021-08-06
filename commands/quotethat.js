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

const { maxGuildQuotes, maxQuoteLength } = require("../config.json");

module.exports = {
	hidden: false,
	name: "quotethat",
	description: "Creates a new quote from a message.",
	usage: "[Message ID | Message link]",
	example: "",
	aliases: ["qthat", "quotethis", "qthis"],
	cooldown: 10,
	args: false,
	guildOnly: true,
	async execute(message, args) {
		const guild = await Guild.findOneAndUpdate(
			{ _id: message.guild.id },
			{},
			{ upsert: true, new: true }
		);

		if (
			guild.allQuote ||
			message.member.permissions.has("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			const serverQuotes = guild.quotes;
			if (
				serverQuotes.length >=
				(guild.maxGuildQuotes || maxGuildQuotes || 75)
			) {
				return await message.channel.send(
					`❌ **|** This server has too many quotes! Use \`${message.prefix}deletequote\` before creating more.`
				);
			}

			let quoteMessage;

			if (args.length) {
				let quoteChannel;

				const splitIDs = args[0].split(/-|\//);

				if (splitIDs.length >= 2) {
					quoteChannel = message.guild.channels.cache.get(
						splitIDs[splitIDs.length - 2]
					);

					if (
						!quoteChannel ||
						!quoteChannel.isText() ||
						!quoteChannel.viewable
					) {
						return await message.channel.send(
							"❌ **|** I couldn't find that channel, are you sure it exists?"
						);
					}
				} else {
					quoteChannel = message.channel;
				}

				try {
					quoteMessage = await quoteChannel.messages.fetch(
						splitIDs[splitIDs.length - 1]
					);
				} catch {
					return await message.channel.send(
						"❌ **|** I couldn't find that message, are you sure it exists?"
					);
				}
			} else {
				try {
					const messages = await message.channel.messages.fetch({
						limit: 1,
						before: message.id,
						force: true,
					});
					quoteMessage = messages?.first();
				} catch (error) {
					console.error(
						`Failed to fetch message in channel #${message.channel.name} (${message.channel.id}) in guild ${message.guild.name} (${message.guild.id})\n${error}`
					);

					return await message.channel.send(
						"❌ **|** Failed to fetch the previous message."
					);
				}
			}

			if (!quoteMessage.content) {
				return await message.channel.send(
					"❌ **|** That message doesn't contain text. Quoter doesn't support embeds!"
				);
			}

			const quoteAuthor = quoteMessage.author?.tag;
			const quoteText = quoteMessage.content;

			if (
				quoteText.length >
				(guild.maxQuoteLength || maxQuoteLength || 130)
			) {
				return await message.channel.send(
					`❌ **|** Quotes cannot be longer than ${
						guild.maxQuoteLength || maxQuoteLength || 130
					} characters.`
				);
			}

			await serverQuotes.push({
				text: quoteText,
				author: quoteAuthor,
				ogMessageID: quoteMessage.id,
				ogChannelID: quoteMessage.channel.id,
				quoterID: message.author.id,
			});

			await guild.save();

			const successEmbed = new MessageEmbed()
				.setTitle("✅ Added quote")
				.setColor("GREEN")
				.setDescription(
					`Created a new server quote:

"${quoteText}" - ${quoteAuthor}`
				)
				.setFooter(`Quote #${serverQuotes.length}`);
			return await message.channel.send({ embeds: [successEmbed] });
		} else {
			await message.channel.send(
				`✋ **|** That action requires the **Manage Guild** permission.

**❗ To allow anyone to create quotes**, use \`${message.prefix}allquote\`.`
			);
		}
	},
};
