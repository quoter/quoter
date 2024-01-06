/*
Copyright (C) 2020-2024 Nick Oates

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

import {
	EmbedBuilder,
	SlashCommandBuilder,
	Colors,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} from "discord.js";
import quoterPackage from "../../package.json";
import ms from "ms";
import QuoterCommand from "../QuoterCommand";
import { Guild } from "../schemas/guild";

let totalQuotes = "0";
let totalQuotesLastUpdated = 0;

const AboutCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("about")
		.setDescription("View information about Quoter"),
	cooldown: 1,
	async execute(interaction) {
		const serverCount =
			interaction.client.guilds.cache.size.toLocaleString();

		const userCount = interaction.client.guilds.cache
			.reduce((acc, g) => acc + g.memberCount, 0)
			.toLocaleString();

		const uptimeDuration = ms(interaction.client.uptime, { long: true });

		// Ping will be -1 if it hasn't been measured yet
		const ping =
			interaction.client.ws.ping >= 0
				? interaction.client.ws.ping + "ms"
				: "Not yet measured";

		// Cache the total number of quotes in the database for 10 minutes
		const timeSinceLastUpdated = Date.now() - totalQuotesLastUpdated;
		if (timeSinceLastUpdated > 600 * 1000) {
			const result = await Guild.aggregate([
				{ $unwind: "$quotes" },
				{ $group: { _id: null, total: { $sum: 1 } } },
			]);

			totalQuotes = result[0]?.total.toLocaleString() || 0;
			totalQuotesLastUpdated = Date.now();
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Blue)
					.setDescription(
						"**Quoter** is a Discord bot that allows you to save messages into a quote book, and share them with your friends. Add, edit, and delete quotes, then view them from a list, get one randomly, or even turn them into images.",
					)
					.addFields([
						{
							name: "🌐 Servers",
							value: "```" + serverCount + "```",
							inline: true,
						},
						{
							name: "👤 Total Users",
							value: "```" + userCount + "```",
							inline: true,
						},
						{
							name: "💬 Total Quotes",
							value: "```" + totalQuotes + "```",
							inline: true,
						},
						{
							name: "⏱️ Ping",
							value: "```" + ping + "```",
							inline: true,
						},
						{
							name: "⏳ Uptime",
							value: "```" + uptimeDuration + "```",
							inline: true,
						},
					])
					.setFooter({ text: `Quoter v${quoterPackage.version}` }),
			],
			components: [
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setEmoji("🤖")
						.setLabel("Add Quoter")
						.setURL(
							"https://discord.com/api/oauth2/authorize?client_id=784853298271748136&scope=bot",
						),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setEmoji("🙋")
						.setLabel("Support Server")
						.setURL("https://discord.gg/QzXTgS2CNk"),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setEmoji("🌐")
						.setLabel("Website")
						.setURL("https://quoter.cc"),
				),
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setEmoji("📜")
						.setLabel("Terms of Service")
						.setURL("https://quoter.cc/terms"),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setEmoji("🔒")
						.setLabel("Privacy Policy")
						.setURL("https://quoter.cc/privacy"),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setEmoji("🛠️")
						.setLabel("GitHub")
						.setURL("https://github.com/quoter/quoter"),
				),
			],
			ephemeral: true,
		});
	},
};

export default AboutCommand;
