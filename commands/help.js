const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: true,
	name: "help",
	description: "Shows a list of all commands",
	usage: "",
	example: "",
	aliases: ["commands", "cmds", "cmdlist", "commandlist"],
	cooldown: 5,
	args: false,
	guildOnly: false,
	supportGuildOnly: false,
	execute(message, args) {
		if (args.length) {
			const commandName = args[0].toLowerCase();
			const command =
				message.client.commands.get(commandName) ||
				message.client.commands.find(
					(command) =>
						command.aliases && command.aliases.includes(commandName)
				);

			if (!command || command.disabled) {
				const noCommandEmbed = new Discord.MessageEmbed()
					.setTitle(`❌ That command doesn't exist or it's disabled`)
					.setColor(config.colors.error)
					.setDescription(
						"Contact an administrator if this is an error"
					);
				return message.channel.send(noCommandEmbed);
			}

			let description = `▫️ **DESCRIPTION**: ${command.description}`;

			if (command.usage) {
				description += `\n▫️ **USAGE**: \`${message.applicablePrefix}${command.name} ${command.usage}\``;
			}

			if (command.example) {
				description += `\n▫️ **EXAMPLE**: \`${message.applicablePrefix}${command.name} ${command.example}\``;
			}

			if (command.aliases.length) {
				let formattedAliases = [];
				command.aliases.forEach((alias) => {
					formattedAliases.push(
						`\`${message.applicablePrefix}${alias}\``
					);
				});

				description =
					description +
					`\n▫️ **ALIASES**: ${formattedAliases.join(", ")}`;
			}

			if (command.supportGuildOnly) {
				description =
					"**❗ This command can only be used in the [support server](https://discord.gg/QzXTgS2CNk)**\n\n" +
					description;
			} else if (command.guildOnly) {
				description =
					"**❗ This command can only be used inside servers**\n\n" +
					description;
			}

			const commandEmbed = new Discord.MessageEmbed()
				.setTitle(
					`Help for \`${message.applicablePrefix}${command.name}\``
				)
				.setColor(config.colors.success)
				.setDescription(description);

			return message.channel.send(commandEmbed);
		} else {
			let commandList;

			message.client.commands.each((command) => {
				if (command.enabled && !command.hidden) {
					commandList += `\n${message.applicablePrefix}${command.name} ${command.usage}`;
				}
			});

			const commandsEmbed = new Discord.MessageEmbed()
				.setTitle(`📘 Command List`)
				.setColor(config.colors.success)
				.setDescription(`Here's a list of all commands you can use. Arguments in \`[]\` are required, while arguments in \`<>\` are optional. You can also use \`${
				message.applicablePrefix
			}help <command>\` to get help for a specific command.
				
				\`\`\`${
					commandList ||
					"No commands were found, contact an administrator about this issue."
				}\`\`\``);

			return message.channel.send(commandsEmbed);
		}
	},
};
