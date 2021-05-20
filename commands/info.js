/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const Discord = require("discord.js");

const humanDuration = (milliseconds) => {
	const result = [];

	const numberEnding = (number) => {
		return number > 1 ? "s" : "";
	};

	let seconds = Math.floor(milliseconds / 1000);

	const years = Math.floor(seconds / 31536000);
	if (years) {
		result.push(`${years} year${numberEnding(years)}`);
	}

	const days = Math.floor((seconds %= 31536000) / 86400);
	if (days) {
		result.push(`${days} day${numberEnding(days)}`);
	}

	const hours = Math.floor((seconds %= 86400) / 3600);
	if (hours) {
		result.push(`${hours} hour${numberEnding(hours)}`);
	}

	const minutes = Math.floor((seconds %= 3600) / 60);
	if (minutes) {
		result.push(`${minutes} minute${numberEnding(minutes)}`);
	}

	if (result.length) {
		if (result.length >= 2) {
			result[result.length - 1] = `and ${result[result.length - 1]}`;
		}

		return result.join(", ");
	} else {
		return "less than a minute";
	}
};

const getDateString = (milliseconds) => {
	const date = new Date(milliseconds);

	return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

module.exports = {
	hidden: false,
	name: "info",
	description: "Displays information about Quoter.",
	usage: "",
	example: "",
	aliases: ["information", "uptime", "support", "invite"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	async execute(message) {
		const infoEmbed = new Discord.MessageEmbed()
			.setTitle("💬 Information")
			.setColor("BLUE")
			.setDescription(
				`*Quoter* is a Discord bot which stores quotes for servers & retrieves them on demand. It supports listing, (randomly) displaying, deleting, and editing quotes!

**[🤖 Add Quoter to your server](https://discord.com/oauth2/authorize?client_id=784853298271748136&scope=bot&permissions=347200)**
[🙋 Support Server](https://discord.gg/QzXTgS2CNk) 
[🐛 Report Bugs](https://github.com/nchristopher/quoter/issues/new/choose)
[🛠️ Source Code](https://github.com/nchristopher/quoter)
[🔒 Privacy Policy](https://github.com/nchristopher/quoter/blob/main/privacy.md)
[💰 Donate](https://ko-fi.com/nchristopher)

Use \`${message.prefix}help\` to get a list of commands.`
			)
			.addField(
				"Server Count",
				`I'm in **${message.client.guilds.cache.size}** servers!`,
				true
			)
			.addField(
				"Uptime",
				`Online since **${getDateString(
					Date.now() - message.client.uptime
				)}**, that's **${humanDuration(message.client.uptime)}**!`,
				true
			)
			.addField(
				"Latency",
				`Average ping is ${message.client.ws.ping} milliseconds.`,
				true
			)
			.setFooter(`Quoter v${require("../package.json").version}`);
		await message.channel.send(infoEmbed);
	},
};
