/*
Copyright (C) 2020-2023 Nick Oates

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

import { EmbedBuilder, SlashCommandBuilder, Colors } from "discord.js";
import quoterPackage from "../../package.json";
import ms from "ms";
import QuoterCommand from "../QuoterCommand";

const InfoCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("info")
		.setDescription("Displays information about Quoter."),
	cooldown: 1,
	async execute(interaction) {
		const {
			client: { uptime, guilds, ws },
			createdTimestamp,
		} = interaction;

		const now = Date.now();

		const serverCount = guilds.cache.size.toLocaleString();
		const msgPing = now - createdTimestamp;
		const startedAt = new Date(now - uptime).toLocaleDateString();
		const duration = ms(uptime, { long: true });
		const memberCount = guilds.cache
			.reduce((acc, g) => acc + g.memberCount, 0)
			.toLocaleString();

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("💬 Information")
					.setColor(Colors.Blue)
					.setDescription(
						`**Quoter** is a Discord bot that allows you to save messages into a quote book, and share them with your friends.

**[🤖 Add Quoter to your server](https://discord.com/api/oauth2/authorize?client_id=784853298271748136&permissions=19456&scope=bot%20applications.commands)**
[🙋 Support Server](https://discord.gg/QzXTgS2CNk) 
[🐛 Report Bugs](https://github.com/n1ckoates/quoter/issues/new/choose)
[🛠️ Source Code](https://github.com/n1ckoates/quoter)
[📜 Terms of Service](https://quoter.cc/terms)
[🔒 Privacy Policy](https://quoter.cc/privacy)`,
					)
					.addFields([
						{
							name: "Server Count",
							value: `I'm in **${serverCount}** servers with a total of **${memberCount}** members!`,
							inline: true,
						},
						{
							name: "Uptime",
							value: `Online since **${startedAt}**, that's **${duration}**!`,
							inline: true,
						},
						{
							name: "Latency",
							value: `I received your message in \`${msgPing}\`ms. WebSocket ping is \`${ws.ping}\`ms`,
							inline: true,
						},
					])
					.setFooter({ text: `Quoter v${quoterPackage.version}` }),
			],
		});
	},
};

export default InfoCommand;
