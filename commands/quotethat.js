/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
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
		if (
			db.get(`${message.guild.id}.allquote`) ||
			message.member.hasPermission("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];
			if (
				serverQuotes.length >=
				(db.get(`${message.guild.id}.maxQuotes`) || 75)
			) {
				return await message.channel.send(
					`❌ **|** This server has too many quotes! Use \`${message.applicablePrefix}deletequote\` before creating more.`
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

					if (!quoteChannel) {
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

			const quoteAuthor = quoteMessage.author.tag;
			const quoteText = quoteMessage.content;

			if (
				quoteText.length >
				(db.get(`${message.guild.id}.maxQuoteSize`) || 130)
			) {
				return await message.channel.send(
					`❌ **|** Quotes cannot be longer than ${
						db.get(`${message.guild.id}.maxQuoteSize`) || 130
					} characters.`
				);
			}

			db.push(`${message.guild.id}.quotes`, {
				text: quoteText,
				author: quoteAuthor,
				createdTimestamp: Date.now(),
				quoteTimestamp: quoteMessage.createdTimestamp,
				quoter: message.author.id,
			});

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Added quote")
				.setColor(config.colors.success)
				.setDescription(
					`Created a new server quote:

"${quoteText}" - ${quoteAuthor}`
				)
				.setFooter(`Quote #${(serverQuotes.length || 0) + 1}`);
			return await message.channel.send(successEmbed);
		} else {
			await message.channel.send(
				`✋ **|** That action requires the **Manage Guild** permission.

**❗ To allow anyone to create quotes**, use \`${message.applicablePrefix}allquote\`.`
			);
		}
	},
};
