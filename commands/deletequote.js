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
	name: "deletequote",
	description: "Deletes the specified quote",
	usage: "<Quote ID>",
	example: "",
	aliases: ["delquote", "dquote", "rmquote", "removequote"],
	cooldown: 8,
	args: true,
	guildOnly: true,
	async execute(message, args) {
		if (
			message.member.hasPermission("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			if (args[0] >= 1) {
				const serverQuotes = db.get(`${message.guild.id}.quotes`);
				const quote = serverQuotes[args[0] - 1];
				if (quote) {
					serverQuotes.splice(args[0] - 1, 1);
					db.set(`${message.guild.id}.quotes`, serverQuotes);

					const successEmbed = new Discord.MessageEmbed()
						.setTitle("✅ Removed quote")
						.setColor(config.colors.success)
						.setDescription(
							`Successfully removed quote #${args[0]}.`
						);
					await message.channel.send(successEmbed);
				} else {
					const quoteNotFoundEmbed = new Discord.MessageEmbed()
						.setTitle("❌ No quote found")
						.setColor(config.colors.error)
						.setDescription("Couldn't find a quote with that ID.");
					await message.channel.send(quoteNotFoundEmbed);
				}
			} else {
				const quoteNotFoundEmbed = new Discord.MessageEmbed()
					.setTitle("❌ No quote found")
					.setColor(config.colors.error)
					.setDescription("You didn't specify a valid ID.");
				await message.channel.send(quoteNotFoundEmbed);
			}
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					"That action requires the Manage Guild permission."
				);
			await message.channel.send(noPermissionEmbed);
		}
	},
};
