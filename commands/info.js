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

const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageEmbed } = require("discord.js");
const { version } = require("../package.json");
const ms = require("ms");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Displays information about Quoter."),
	cooldown: 1,
	guildOnly: false,
	async execute(interaction) {
		const {
			client: { uptime, guilds, ws },
			createdTimestamp,
		} = interaction;

		const now = Date.now();

		const serverCount = guilds.cache.size;
		const msgPing = now - createdTimestamp;
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
[💰 Donate](https://ko-fi.com/nchristopher)`
			)
			.addField(
				"Server Count",
				`I'm in **${serverCount}** servers with a total of **${memberCount}** members!`,
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
		await interaction.reply({ embeds: [infoEmbed] });
	},
};
