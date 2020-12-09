const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "info",
	description: "Shows information about the bot",
	usage: "",
	aliases: ["information", "uptime", "support", "invite"],
	cooldown: 3,
	args: false,
	guildOnly: false,
	supportGuildOnly: false,
	execute(message, args) {
		const infoEmbed = new Discord.MessageEmbed()
			.setTitle("💬 Information")
			.setColor(config.colors.general)
			.setDescription(
				`*Quoter* is a Discord bot which stores quotes for servers & retrieves them on demand. It supports listing, (randomly) displaying, deleting, and editing quotes! You can invite the bot to your server [here](https://discord.com/oauth2/authorize?client_id=784853298271748136&scope=bot&permissions=347200).
				
				[Source Code](https://github.com/nickhasoccured/quoter) | [Support Server](https://discord.gg/QzXTgS2CNk)
				Use \`${message.applicablePrefix}help\` to get a list of commands`
			);
		message.channel.send(infoEmbed);
	},
};
