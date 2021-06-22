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

const { disabledCommands } = require("../config.json");

module.exports = {
	hidden: true,
	name: "help",
	description: "Shows a list of commands, or details about one.",
	usage: "[Command]",
	example: "privacy",
	aliases: ["commands", "cmds", "cmdlist", "commandlist"],
	cooldown: 5,
	args: false,
	guildOnly: false,
	async execute(message, args) {
		if (args.length) {
			const commandName = args[0].toLowerCase();
			const command =
				message.client.commands.get(commandName) ||
				message.client.commands.find(
					(cmd) => cmd.aliases && cmd.aliases.includes(commandName)
				);

			if (!command || disabledCommands?.includes(command.name)) {
				return await message.channel.send(
					"❌ **|** That command doesn't exist, or it's disabled."
				);
			}

			let description = `▫️ **DESCRIPTION**: ${command.description}`;

			if (command.usage) {
				description += `\n▫️ **USAGE**: \`${message.prefix}${command.name} ${command.usage}\``;
			}

			if (command.example) {
				description += `\n▫️ **EXAMPLE**: \`${message.prefix}${command.name} ${command.example}\``;
			}

			if (command.aliases.length) {
				const formattedAliases = [];
				command.aliases.forEach((alias) => {
					formattedAliases.push(`\`${message.prefix}${alias}\``);
				});

				description =
					description +
					`\n▫️ **ALIASES**: ${formattedAliases.join(", ")}`;
			}

			if (command.guildOnly) {
				description =
					"**❗ This command can only be used inside servers**\n\n" +
					description;
			}

			const commandEmbed = new Discord.MessageEmbed()
				.setTitle(`\`${message.prefix}${command.name}\``)
				.setColor("GREEN")
				.setDescription(description);

			await message.channel.send(commandEmbed);
		} else {
			let commandList;

			message.client.commands.each((command) => {
				if (
					command.hidden ||
					disabledCommands?.includes(command.name)
				) {
					return;
				}

				commandList += `\n${message.prefix}${command.name} ${command.usage}`;
			});

			const commandsEmbed = new Discord.MessageEmbed()
				.setTitle("📘 Command List")
				.setColor("GREEN")
				.setDescription(`Here's a list of all the commands you can use.

Arguments in \`<>\` are required, while arguments in \`[]\` are optional. You can also use \`${
				message.prefix
			}help <command>\` to get help for a specific command.

\`\`\`${
				commandList ||
				"No commands were found, contact an administrator about this issue."
			}\`\`\``);

			await message.channel.send(commandsEmbed);
		}
	},
};
