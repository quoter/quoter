/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

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
	async execute(message) {
		if (config.admins?.includes(message.author.id)) {
			if (message.client.admins.get(message.author.id)) {
				message.client.admins.set(message.author.id, false);

				await message.channel.send(
					"✅ **|** Admin features have been __enabled__ for you."
				);
			} else {
				message.client.admins.set(message.author.id, true);

				await message.channel.send(
					"✅ **|** Admin features have been __disabled__ for you."
				);
			}
		} else {
			await message.channel.send(
				"✋ **|** That action can only be used by bot administrators."
			);
		}
	},
};
