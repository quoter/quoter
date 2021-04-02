/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const Discord = require("discord.js");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: true,
	name: "toggleadmin",
	description: "Toggles admin features.",
	usage: "",
	example: "",
	aliases: ["togglebypass"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	supportGuildOnly: false,
	async execute(message) {
		if (config.admins?.includes(message.author.id)) {
			if (message.client.admins.get(message.author.id)) {
				message.client.admins.set(message.author.id, false);

				const successEmbed = new Discord.MessageEmbed()
					.setTitle("✅ Toggled setting")
					.setColor(config.colors.success)
					.setDescription(
						"You no longer have access to admin features."
					);
				await message.channel.send(successEmbed);
			} else {
				message.client.admins.set(message.author.id, true);

				const successEmbed = new Discord.MessageEmbed()
					.setTitle("✅ Toggled setting")
					.setColor(config.colors.success)
					.setDescription("You now have access to admin features.");
				await message.channel.send(successEmbed);
			}
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					"That action can only be use by administrators."
				);
			await message.channel.send(noPermissionEmbed);
		}
	},
};
