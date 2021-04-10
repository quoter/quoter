/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const db = require("quick.db");

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
	async execute(message) {
		if (
			message.member.hasPermission("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			const currentState =
				db.get(`${message.guild.id}.allquote`) || false;
			if (currentState === true) {
				db.set(`${message.guild.id}.allquote`, false);
				await message.channel.send(
					"✅ **|** Only server managers can now create quotes."
				);
			} else if (currentState === false) {
				db.set(`${message.guild.id}.allquote`, true);
				await message.channel.send(
					"✅ **|** Everyone can now create quotes."
				);
			}
		} else {
			await message.channel.send(
				"✋ **|** That action requires the **Manage Guild** permission."
			);
		}
	},
};
