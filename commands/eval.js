/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

// eslint-disable-next-line no-unused-vars
const db = require("quick.db");

module.exports = {
	enabled: true,
	hidden: true,
	name: "eval",
	description: "Runs code from an admin.",
	usage: "<Code>",
	example: "",
	aliases: [],
	cooldown: 3,
	args: true,
	guildOnly: false,
	async execute(message, args) {
		if (message.client.admins.get(message.author.id)) {
			try {
				eval(args.join(" "));
			} catch (error) {
				await message.channel.send(
					"❌ **|** An error occurred, I've messaged you more information."
				);

				return await message.author.send(
					`❌ **|** An error occurred, here's some more information:
\`\`\`${error}\`\`\``
				);
			}

			await message.channel.send("✅ **|** The code ran with no errors.");
		} else {
			await message.channel.send(
				"✋ **|** That action can only be used by bot administrators."
			);
		}
	},
};
