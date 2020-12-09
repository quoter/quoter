const Discord = require("discord.js");
const db = require("quick.db");

const getApplicablePrefix = require("../getApplicablePrefix.js");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "prefix",
	description: "Shows the server's prefix or sets a new one",
	usage: "<new prefix>",
	aliases: ["setprefix", "newprefix"],
	cooldown: 10,
	args: false,
	guildOnly: true,
	supportGuildOnly: false,
	execute(message, args) {
		const currentPrefix = getApplicablePrefix.execute(message);
		if (args.length) {
			if (message.member.hasPermission("MANAGE_GUILD")) {
				if (
					/^[a-zA-Z0-9!_.+#$@%^&*(){}=:;'"\/\\\-\[\]]{1,3}$/.test(
						args[0]
					)
				) {
					db.set(`${message.guild.id}.prefix`, args[0]);
					const successEmbed = new Discord.MessageEmbed()
						.setTitle("✅ Changed Prefix")
						.setColor(config.colors.success)
						.setDescription(
							`This server's prefix is now \`${args[0]}\` (from \`${currentPrefix}\`). You can also mention me instead!`
						);
					message.channel.send(successEmbed);
				} else {
					const invalidPrefixEmbed = new Discord.MessageEmbed()
						.setTitle("❌ Invalid Prefix")
						.setColor(config.colors.error)
						.setDescription(
							`\`${args[0]}\` isn't a valid prefix! Prefixes can be alphanumeric, along with some special characters. They cannot be longer than three characters!`
						);
					message.channel.send(invalidPrefixEmbed);
				}
			} else {
				const noPermissionEmbed = new Discord.MessageEmbed()
					.setTitle("❌ You don't have permission to do that")
					.setColor(config.colors.error)
					.setDescription(
						"That action requires the Manage Guild permission."
					);
				message.channel.send(invalidPrefixEmbed);
			}
		} else {
			const prefixEmbed = new Discord.MessageEmbed()
				.setTitle(`\`${currentPrefix}\``)
				.setColor(config.colors.success)
				.setDescription(
					`This server's prefix is \`${currentPrefix}\` - you can also mention me instead!`
				);
			message.channel.send(prefixEmbed);
		}
	},
};
