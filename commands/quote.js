/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const Discord = require("discord.js");
const Guild = require("../schemas/guild.js");

module.exports = {
	hidden: false,
	name: "quote",
	description: "Displays a specified quote or a random one.",
	usage: "[Quote ID]",
	example: "",
	aliases: ["q", "randomquote", "randquote", "rquote"],
	cooldown: 5,
	args: false,
	guildOnly: true,
	async execute(message, args) {
		const serverQuotes =
			(await Guild.findById(message.guild.id))?.quotes || [];
		if (!serverQuotes.length) {
			return await message.channel.send(
				`❌ **|** This server doesn't have any quotes, use \`${message.prefix}newquote\` to add some!`
			);
		}

		let quote;

		if (args.length) {
			quote = serverQuotes[args[0] - 1];
			if (!quote) {
				return await message.channel.send(
					"❌ **|** I couldn't find a quote with that ID."
				);
			}
		} else {
			quote =
				serverQuotes[Math.floor(Math.random() * serverQuotes.length)];
		}

		const quoteEmbed = new Discord.MessageEmbed()
			.setColor("BLUE")
			.setDescription(
				`"${
					quote.text ||
					"An error occurred while retrieving that quote"
				}"${
					quote.ogMessageID && quote.ogChannelID
						? `\n> [Original Message](https://discord.com/channels/${message.guild.id}/${quote.ogChannelID}/${quote.ogMessageID})`
						: ""
				}`
			);

		if (quote.createdTimestamp) {
			quoteEmbed.setTimestamp(
				quote.editedTimestamp || quote.createdTimestamp
			);
		}

		if (quote.author?.length > 1) {
			quoteEmbed.setAuthor(quote.author);
		}

		quoteEmbed.setFooter(`Quote #${serverQuotes.indexOf(quote) + 1}`);

		await message.channel.send(quoteEmbed);
	},
};
