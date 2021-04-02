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
	name: "allquote",
	description: "Toggles whether everyone can create quotes.",
	usage: "",
	example: "",
	aliases: ["anyquote", "anyonecanquote", "allcanquote"],
	cooldown: 10,
	args: false,
	guildOnly: true,
	supportGuildOnly: false,
	async execute(message) {
		if (
			message.member.hasPermission("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			const currentState =
				db.get(`${message.guild.id}.allquote`) || false;
			if (currentState === true) {
				db.set(`${message.guild.id}.allquote`, false);
				const successEmbed = new Discord.MessageEmbed()
					.setTitle("✅ Toggled setting")
					.setColor(config.colors.success)
					.setDescription(
						"Only members with the Manage Guild permission can now create quotes."
					);
				await message.channel.send(successEmbed);
			} else if (currentState === false) {
				db.set(`${message.guild.id}.allquote`, true);
				const successEmbed = new Discord.MessageEmbed()
					.setTitle("✅ Toggled setting")
					.setColor(config.colors.success)
					.setDescription("Everyone can now create quotes.");
				await message.channel.send(successEmbed);
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
