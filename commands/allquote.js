const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "allquote",
	description: "Toggles whether everyone can create quotes.",
	usage: "",
	example: "",
	aliases: ["anyquote", "anyonecanquote", "allcanquote"],
	cooldown: 10,
	args: false,
	guildOnly: true,
	supportGuildOnly: false,
	execute(message, args) {
		if (message.member.hasPermission("MANAGE_GUILD")) {
			const currentState =
				db.get(`${message.guild.id}.allquote`) || false;
			if (currentState === true) {
				db.set(`${message.guild.id}.allquote`, false);
				const successEmbed = new Discord.MessageEmbed()
					.setTitle("✅ Toggled setting")
					.setColor(config.colors.success)
					.setDescription(
						"Only members with the Manage Guild permission can now create quotes."
					);
				message.channel.send(successEmbed);
			} else if (currentState === false) {
				db.set(`${message.guild.id}.allquote`, true);
				const successEmbed = new Discord.MessageEmbed()
					.setTitle("✅ Toggled setting")
					.setColor(config.colors.success)
					.setDescription("Everyone can now create quotes.");
				message.channel.send(successEmbed);
			}
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					"That action requires the Manage Guild permission."
				);
			message.channel.send(noPermissionEmbed);
		}
	},
};
