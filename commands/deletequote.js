const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "deletequote",
	description: "Deletes the specified quote",
	usage: "[quote number]",
	aliases: ["delquote", "dquote", "rmquote", "removequote"],
	cooldown: 8,
	args: true,
	guildOnly: true,
	supportGuildOnly: false,
	execute(message, args) {
		if (message.member.hasPermission("MANAGE_GUILD")) {
			if (args[0] >= 1) {
				let serverQuotes = db.get(`${message.guild.id}.quotes`);
				const quote = serverQuotes[args[0] - 1];
				if (quote) {
					serverQuotes.splice(args[0] - 1, 1);
					db.set(`${message.guild.id}.quotes`, serverQuotes);

					const successEmbed = new Discord.MessageEmbed()
						.setTitle("✅ Removed quote")
						.setColor(config.colors.success)
						.setDescription(
							`Successfully removed quote with ID ${args[0]}.`
						);
					message.channel.send(successEmbed);
				} else {
					const quoteNotFoundEmbed = new Discord.MessageEmbed()
						.setTitle("❌ No quote found")
						.setColor(config.colors.error)
						.setDescription("Couldn't find a quote with that ID.");
					message.channel.send(quoteNotFoundEmbed);
				}
			} else {
				const quoteNotFoundEmbed = new Discord.MessageEmbed()
					.setTitle("❌ No quote found")
					.setColor(config.colors.error)
					.setDescription("You didn't specify a valid ID.");
				message.channel.send(quoteNotFoundEmbed);
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
