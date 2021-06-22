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

const Discord = require("discord.js");

const privacyPolicyEmbed = new Discord.MessageEmbed()
	.setTitle("🔒 Privacy Policy")
	.setColor("BLUE")
	.setDescription(
		`> Last updated on 5/7/2021

This document explains what data is collected, how it's used, and how you can delete your data. **If you have any questions/concerns about this Privacy Policy, join our [support server](https://discord.gg/QzXTgS2CNk) OR email \`nchristopher@tuta.io\`**.`
	)
	.addFields(
		{
			name: "What data do we collect, and why do we need it?",
			value: `We store the information that you provide to Quoter. Additionally, we automatically collect some other data:

-   The current time & date when creating a quote. This is displayed when viewing a singular quote.
-   The Discord user ID of whoever created the quote. This isn't currently used.
-   The message ID & channel ID of the original message when using the \`quotethat\` command.

Data storage is necessary for the bot to do it's basic function - displaying quotes. We never use/collect data for marketing and/or analytics, and we don't sell it either. Data is **only** accessible by Quoter developers & the end user.`,
			inline: false,
		},
		{
			name: "How can I delete my data?",
			value: `If Quoter is online when it's removed from a Discord server, all that server's data will be **deleted**. Otherwise, Quoter will scan for removed guilds the next time it's online, and delete data as so.

You can also contact us (refer to the beginning of this document) to manually remove your data.`,
			inline: false,
		}
	);

module.exports = {
	hidden: false,
	name: "privacy",
	description: "Displays Quoter's Privacy Policy.",
	usage: "",
	example: "",
	aliases: ["pp", "policy", "privacypolicy"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	async execute(message) {
		await message.channel.send(privacyPolicyEmbed);
	},
};
