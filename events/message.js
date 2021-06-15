/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

const { Collection } = require("discord.js");
const Guild = require("../schemas/guild.js");
const config = require("../config.json");

const cooldowns = new Collection();

module.exports = {
	name: "message",
	once: false,
	async execute(message, client) {
		if (message.author.bot) return;
		if (
			message.guild &&
			config.blockedGuilds?.includes?.(message.guild.id)
		) {
			return message.guild.leave();
		}
		if (config.blockedUsers?.includes?.(message.author.id)) return;

		message.prefix = message.guild
			? (await Guild.findById(message.guild.id))?.prefix ||
			  config.defaultPrefix
			: config.defaultPrefix;

		const prefix = [
			`<@${client.user.id}>`,
			`<@!${client.user.id}>`,
			message.prefix,
		].find((p) =>
			message.content.trim().toLowerCase().startsWith(p.toLowerCase())
		);

		if (!prefix) return;

		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

		const command =
			client.commands.get(commandName) ||
			client.commands.find((cmd) => cmd.aliases?.includes?.(commandName));

		if (!command) return;

		if (
			message.channel
				?.permissionsFor?.(client.user.id)
				?.has?.("EMBED_LINKS") === false
		) {
			try {
				return message.channel.send(
					"❌ **|** Quoter doesn't have permissions to **Embed Links** in this channel."
				);
			} catch (error) {
				return console.error(
					`Failed to send message in #${message.channel.name} (${
						message.channel.id
					})${
						message.guild
							? ` of server ${message.guild.name} (${message.guild.id})`
							: ""
					}\n${error}`
				);
			}
		}

		if (config.disabledCommands?.includes?.(command.name)) {
			try {
				return message.channel.send(
					`❌ **|** \`${message.prefix}${command.name}\` is a disabled command.`
				);
			} catch (error) {
				return console.error(
					`Failed to send message in #${message.channel.name} (${
						message.channel.id
					})${
						message.guild
							? ` of server ${message.guild.name} (${message.guild.id})`
							: ""
					}\n${error}`
				);
			}
		}

		if (command.guildOnly && !message.guild) {
			try {
				return message.channel.send(
					`❌ **|** \`${message.prefix}${command.name}\` can only be used inside servers.`
				);
			} catch (error) {
				return console.error(
					`Failed to send message in #${message.channel.name} (${
						message.channel.id
					})${
						message.guild
							? ` of server ${message.guild.name} (${message.guild.id})`
							: ""
					}\n${error}`
				);
			}
		}

		if (command.args && !args.length) {
			try {
				return message.channel.send(
					`❌ **|** You didn't provide any arguments.\n${
						command.usage
							? `Usage: \`${message.prefix}${command.name} ${command.usage}\``
							: ""
					}`
				);
			} catch (error) {
				return console.error(
					`Failed to send message in #${message.channel.name} (${
						message.channel.id
					})${
						message.guild
							? ` of server ${message.guild.name} (${message.guild.id})`
							: ""
					}\n${error}`
				);
			}
		}

		if (!client.admins.get(message.author.id)) {
			if (!cooldowns.has(command.name)) {
				cooldowns.set(command.name, new Collection());
			}

			const now = Date.now();
			const timestamps = cooldowns.get(command.name);
			const cooldownAmount = (command.cooldown ?? 3) * 1000;

			if (timestamps.has(message.author.id)) {
				const expirationTime =
					timestamps.get(message.author.id) + cooldownAmount;

				if (now < expirationTime) {
					const timeLeft = (expirationTime - now) / 1000;
					try {
						return message.channel.send(
							`🛑 **|** Wait ${timeLeft.toFixed(
								0
							)} second(s) before using \`${message.prefix}${
								command.name
							}\` again.`
						);
					} catch (error) {
						console.error(
							`Failed to send message in #${
								message.channel.name
							} (${message.channel.id})${
								message.guild
									? ` of server ${message.guild.name} (${message.guild.id})`
									: ""
							}\n${error}`
						);
					}
				}
			}

			timestamps.set(message.author.id, now);
			setTimeout(
				() => timestamps.delete(message.author.id),
				cooldownAmount
			);
		}

		try {
			await command.execute(message, args);
		} catch (error) {
			console.error(`Failed to execute command ${command.name} for user ${message.author.tag} (${message.author.id})
			* ${error}`);

			try {
				await message.channel.send(
					`❌ **|** An error occurred. Please report this to Quoter's developers with \`${message.prefix}bugs\`.`
				);
			} catch (error2) {
				console.error(
					`Failed to send message in #${message.channel.name} (${
						message.channel.id
					})${
						message.guild
							? ` of server ${message.guild.name} (${message.guild.id})`
							: ""
					}\n${error2}`
				);
			}
		}

		if (Math.random() >= 1 - (config.upvoteChance ?? 1) / 100) {
			try {
				await message.channel.send(
					"💬 **|** If you're enjoying Quoter, consider upvoting it! <https://discordextremelist.xyz/bots/quoter/>"
				);
			} catch (error) {
				console.error(
					`Failed to send message in #${message.channel.name} (${
						message.channel.id
					})${
						message.guild
							? ` of server ${message.guild.name} (${message.guild.id})`
							: ""
					}\n${error}`
				);
			}
		}
	},
};
