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
			message.member.permissions.has("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			if (args[0] >= 1) {
				const guild = await Guild.findOneAndUpdate(
					{ _id: message.guild.id },
					{},
					{ upsert: true, new: true }
				);
				const serverQuotes = guild.quotes;

				const quote = serverQuotes[args[0] - 1];
				if (quote) {
					await serverQuotes.splice(args[0] - 1, 1);
					await guild.save();

					await message.channel.send(
						`✅ **|** Deleted quote #${args[0]}.`
					);
				} else {
					await message.channel.send(
						"❌ **|** I couldn't find a quote with that ID."
					);
				}
			} else {
				await message.channel.send("❌ **|** That's not a valid ID.");
			}
		} else {
			await message.channel.send(
				"✋ **|** That action requires the **Manage Guild** permission."
			);
		}
	},
};
