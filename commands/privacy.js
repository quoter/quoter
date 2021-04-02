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
	name: "privacy",
	description: "Displays Quoter's Privacy Policy.",
	usage: "",
	example: "",
	aliases: ["pp", "policy", "privacypolicy"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	supportGuildOnly: false,
	async execute(message) {
		const privacyPolicyEmbed = new Discord.MessageEmbed()
			.setTitle("🔒 Privacy Policy")
			.setColor(config.colors.general)
			.setDescription(
				`> Last updated on 3/25/2021

This document explains what data is collected, how it's used, and how you can delete your data. **If you have any questions/concerns about this Privacy Policy, join our [support server](https://discord.gg/QzXTgS2CNk) OR email \`nchristopher@tuta.io\`**.`
			)
			.addFields(
				{
					name: "What data do we collect, and why do we need it?",
					value: `We store the following information when users interact with quoter:

•   The quote's text & the quote's author. Users can later view this information when interacting with Quoter.
•   The current date. Users can later view this information when interacting with Quoter.
•   The creation date of the quoted message, when using the \`.quotethat\` command. This isn't currently used.
•   The quote creator's Discord ID. This isn't currently used.
•   A prefix set by a server admin. This is used by Quoter to properly respond to & ignore messages.

Data storage is necessary for the bot to do it's basic function - displaying quotes. We never use/collect data for marketing and/or analytics. Data is **only** accessible by Quoter developers, and the user who uses Quoter.`,
					inline: false,
				},
				{
					name: "How can I delete my data?",
					value: `If Quoter is online when it's removed from a Discord server, all that server's data will be **deleted**. Otherwise, Quoter will scan for removed guilds the next time it's online, and delete data as so.

You can also contact us (refer to the beginning of this document) to manually remove your data.`,
					inline: false,
				}
			);
		await message.channel.send(privacyPolicyEmbed);
	},
};
