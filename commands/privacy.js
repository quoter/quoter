const Discord = require("discord.js");
const db = require("quick.db");

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
				"This document explains what data is collected, how it's used, and how you can delete your data. __If you have any questions/concerns about this Privacy Policy, join our [support server](https://discord.gg/QzXTgS2CNk) OR email `nchristopher@tuta.io`__"
			)
			.addFields(
				{
					name: "What data do we collect, and why do we need it?",
					value: `Information about the quote is collected when a new quote is created, this includes:
					- The quote's text, later retrieved when using the \`quote\` command.
					- The quote's author, later retrieved when using the \`quote\` command.
					- The timestamp of when the quote was created. This isn't currently used, but may be in the future.
					- When using the \`quotethat\` command, the timestamp of the original message is also stored.
					- Who created the quote, this is stored as your Discord user ID. This isn't currently used, but may be in the future.
					
					If the server's prefix is set, that prefix is also stored. __This is tied to the server itself, not a person.__
					
					Data storage is necessary for the bot to do it's basic function - displaying quotes. We never use/collect data for marketing and/or analytics. Data is __only__ accessible by Quoter developers, engineers, and support.
					`,
					inline: false,
				},
				{
					name: "How can I delete my data?",
					value: `If Quoter is removed from a Discord server, all information about that server (quotes & prefix) are deleted. The only information ever tied to a specific user is a quote's creator, this is only your user ID. If you'd like your specific data to be removed, refer to the contact methods at the beggining of this document.`,
					inline: false,
				}
			);
		message.channel.send(privacyPolicyEmbed);
	},
};
