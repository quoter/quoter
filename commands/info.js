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

const { MessageEmbed } = require("discord.js");
const { version } = require("../package.json");
const ms = require("ms");

module.exports = {
	hidden: false,
	name: "info",
	description: "Displays information about Quoter.",
	usage: "",
	example: "",
	aliases: ["information", "uptime", "support", "invite", "ping"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	async execute(message) {
		const { guilds, uptime, ws } = message.client;
		const now = Date.now();

		const msgPing = now - message.createdTimestamp;
		const startedAt = new Date(now - uptime).toLocaleDateString();
		const duration = ms(uptime, { long: true });
		const memberCount = guilds.cache
			.reduce((acc, g) => acc + g.memberCount, 0)
			.toLocaleString();

		const infoEmbed = new MessageEmbed()
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
				`I'm in **${guilds.cache.size}** servers with a total of **${memberCount}** members!`,
				true
			)
			.addField(
				"Uptime",
				`Online since **${startedAt}**, that's **${duration}**!`,
				true
			)
			.addField(
				"Latency",
				`I received your message in \`${msgPing}\`ms. WebSocket ping is \`${ws.ping}\`ms`,
				true
			)
			.setFooter(`Quoter v${version}`);
		await message.channel.send({ embeds: [infoEmbed] });
	},
};
