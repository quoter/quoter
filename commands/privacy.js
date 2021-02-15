const Discord = require("discord.js");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "privacy",
	description: "Shows the bot's privacy policy",
	usage: "",
	example: "",
	aliases: ["pp", "policy", "privacypolicy"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	supportGuildOnly: false,
	execute(message, args) {
		const privacyPolicyEmbed = new Discord.MessageEmbed()
			.setTitle("🔒 Privacy Policy")
			.setColor(config.colors.general)
			.setDescription(
				`
				> Last updated on 2/14/2021

				This document explains what data is collected, how it's used, and how you can delete your data. **If you have any questions/concerns about this Privacy Policy, join our [support server](https://discord.gg/QzXTgS2CNk) OR email \`nchristopher@tuta.io\`**.
			`
			)
			.addFields(
				{
					name: "What data do we collect, and why do we need it?",
					value: `
					We store the following information when users interact with quoter:
					
					•   The quote's text & the quote's author. Users can later view this information when interacting with Quoter.
					•   The current date. Users can later view this information when interacting with Quoter.
					•   The creation date of the quoted message, when using the \`.quotethat\` command. This isn't currently used.
					•   The quote creator's Discord ID. This isn't currently used.
					•   A prefix set by a server admin. This is used by Quoter to properly respond to & ignore messages.
					
					Data storage is necessary for the bot to do it's basic function - displaying quotes. We never use/collect data for marketing and/or analytics. Data is **only** accessible by Quoter developers, and the user who uses Quoter.
					`,
					inline: false,
				},
				{
					name: "How can I delete my data?",
					value: `If Quoter is online when it's removed from a Discord server, all that server's data will be **deleted**. Otherwise, Quoter will scan for removed guilds the next time it's online, and delete data as so.

					You can also contact us (refer to the beggining of this document) to manually remove your data.`,
					inline: false,
				}
			);
		message.channel.send(privacyPolicyEmbed);
	},
};
