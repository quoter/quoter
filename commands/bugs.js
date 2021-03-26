const Discord = require("discord.js");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "bugs",
	description: "Shows how to report bugs, suggest features, and more.",
	usage: "",
	example: "",
	aliases: ["suggestion", "suggest", "issue", "bug"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	supportGuildOnly: false,
	async execute(message, args) {
		const issueEmbed = new Discord.MessageEmbed()
			.setTitle("Quoter Issues")
			.setColor(config.colors.general)
			.setDescription(
				"You can report bugs, suggest features, or post other issues on Quoter's [GitHub Issues](https://github.com/nickhasoccured/quoter/issues) page."
			);
		await message.channel.send(issueEmbed);
	},
};
