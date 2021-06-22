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

const Guild = require("../schemas/guild.js");

module.exports = {
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
			message.member.permissions.has("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			const currentState = (await Guild.findById(message.guild.id))
				?.allQuote;

			await Guild.findOneAndUpdate(
				{ _id: message.guild.id },
				{ allQuote: !currentState },
				{
					upsert: true,
				}
			);

			if (currentState) {
				await message.channel.send(
					"✅ **|** Only server managers can now create quotes."
				);
			} else {
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
