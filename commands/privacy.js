/*
Copyright (C) 2020-2023 Nicholas Christopher

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

const { EmbedBuilder, SlashCommandBuilder, Colors } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("privacy")
		.setDescription("Shows Quoter's privacy policy."),
	async execute(interaction) {
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("🔒 Privacy Policy")
					.setColor(Colors.Blue)
					.setDescription(
						`> Last updated on 7/9/2022
			
			This document explains what data is collected, how it's used, and how you can delete your data. **If you have any questions/concerns about this Privacy Policy, join our [support server](https://discord.gg/QzXTgS2CNk) OR email \`nchristopher@tuta.io\`**.`
					)
					.addFields(
						{
							name: "What data do we collect, and why do we need it?",
							value: `We store the information that you provide to Quoter. Additionally, we automatically collect some other data:
			
			-   The current time & date when creating a quote. This is displayed when viewing a singular quote.
			-   The Discord user ID of whoever created the quote. This is displayed when using the \`whoquoted\` command.
			-   The message ID & channel ID of the original message when using the \`Quote This\` context menu command.
			
			Data storage is necessary for the bot to do it's basic function - displaying quotes. We never use/collect data for marketing and/or analytics, and we don't sell it either. Data is **only** accessible by Quoter developers & the end user.`,
							inline: false,
						},
						{
							name: "How can I delete my data?",
							value: `If Quoter is online when it's removed from a Discord server, all that server's data will be **deleted**. Otherwise, Quoter will scan for removed guilds the next time it's online, and delete data as so.
			
			You can also contact us (refer to the beginning of this document) to manually remove your data.`,
							inline: false,
						}
					),
			],
			ephemeral: true,
		});
	},
};
