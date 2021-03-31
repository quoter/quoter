const Discord = require("discord.js");
// eslint-disable-next-line no-unused-vars
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: true,
	name: "eval",
	description: "Runs code from an admin.",
	usage: "<Code>",
	example: "",
	aliases: [],
	cooldown: 3,
	args: true,
	guildOnly: false,
	supportGuildOnly: false,
	async execute(message, args) {
		if (message.client.admins.get(message.author.id)) {
			try {
				eval(args.join(" "));
			} catch (error) {
				const errorEmbed = new Discord.MessageEmbed()
					.setColor(config.colors.error)
					.setTitle("❌ An error occurred")
					.setDescription("I've messaged you more information.");
				await message.channel.send(errorEmbed);

				const detailedErrorEmbed = new Discord.MessageEmbed()
					.setColor(config.colors.error)
					.setTitle("❌ An error occurred")
					.setDescription(
						`Here's some more information:
						\`\`\`${error}\`\`\``
					);
				return await message.author.send(detailedErrorEmbed);
			}

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Success")
				.setColor(config.colors.success)
				.setDescription("The code ran with no errors.");
			await message.channel.send(successEmbed);
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					"That action can only be use by administrators."
				);
			await message.channel.send(noPermissionEmbed);
		}
	},
};
