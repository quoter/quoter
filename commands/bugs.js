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
	hidden: false,
	name: "bugs",
	description: "Shows how to report bugs, suggest features, and more.",
	usage: "",
	example: "",
	aliases: ["suggestion", "suggest", "issue", "bug"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	async execute(message) {
		const issueEmbed = new Discord.MessageEmbed()
			.setTitle("Quoter Issues")
			.setColor(config.colors.general)
			.setDescription(
				"You can report bugs, suggest features, or post other issues on Quoter's [GitHub Issues](https://github.com/nchristopher/quoter/issues) page."
			);
		await message.channel.send(issueEmbed);
	},
};
