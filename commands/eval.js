/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const clean = (text) => {
	if (typeof text === "string") {
		return text
			.replace(/`/g, "`" + String.fromCharCode(8203))
			.replace(/@/g, "@" + String.fromCharCode(8203));
	} else {
		return text;
	}
};

module.exports = {
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
				const code = args.join(" ");
				let evaled = eval(code);

				if (typeof evaled !== "string") {
					evaled = require("util").inspect(evaled);
				}

				message.channel.send(clean(evaled), { code: "xl" });
			} catch (err) {
				message.channel.send(
					`❌ **|** An error occurred: 
\`\`\`xl
${clean(err)}
\`\`\``
				);
			}
		} else {
			await message.channel.send(
				"✋ **|** That action can only be used by bot administrators."
			);
		}
	},
};
