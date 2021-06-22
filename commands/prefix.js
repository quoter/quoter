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
	name: "prefix",
	description: "Sends the server prefix, or sets a new one.",
	usage: "[New Prefix]",
	example: "!",
	aliases: ["setprefix", "newprefix"],
	cooldown: 10,
	args: false,
	guildOnly: true,
	async execute(message, args) {
		if (args.length) {
			if (
				message.member.permissions.has("MANAGE_GUILD") ||
				message.client.admins.get(message.author.id)
			) {
				if (
					/^[a-zA-Z0-9!_.+#$@%^&*(){}=:;'"\\/\-[\]]{1,3}$/.test(
						args[0]
					)
				) {
					await Guild.findOneAndUpdate(
						{ _id: message.guild.id },
						{ prefix: args[0] },
						{
							upsert: true,
						}
					);

					await message.channel.send(
						`✅ **|** This server's prefix is now \`${args[0]}\` (from \`${message.prefix}\`) - you can always mention me instead!`
					);
				} else {
					await message.channel.send(
						`❌ **|** \`${args[0]}\` isn't a valid prefix! Prefixes must be alphanumeric and a maximum of 3 characters long.`
					);
				}
			} else {
				await message.channel.send(
					"✋ **|** That action requires the **Manage Guild** permission."
				);
			}
		} else {
			await message.channel.send(
				`⚙️ **|** This server's prefix is **\`${message.prefix}\`** - you can always mention me instead!`
			);
		}
	},
};
