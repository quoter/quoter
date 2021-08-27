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

const { Collection } = require("discord.js");
const { disabledCommands } = require("../config.json");

const cooldowns = new Collection();

module.exports = {
	name: "interactionCreate",
	once: false,
	async execute(interaction, client) {
		const { commandName, user } = interaction;

		if (!interaction.isCommand()) return;

		const command = client.commands.get(commandName);
		if (!command) return;

		if (disabledCommands?.includes?.(commandName)) {
			return interaction.reply({
				content: "❌ **|** That command is currently disabled.",
				ephemeral: true,
			});
		}

		if (command.guildOnly && !interaction.inGuild()) {
			return interaction.reply({
				content:
					"❌ **|** That command can only be used inside servers.",
				ephemeral: true,
			});
		}

		if (!client.admins.includes(user.id) && command.cooldown) {
			if (!cooldowns.has(commandName)) {
				cooldowns.set(commandName, new Collection());
			}

			const now = Date.now();
			const timestamps = cooldowns.get(commandName);
			const cooldownAmount = command.cooldown * 1000;

			if (timestamps.has(user.id)) {
				const expirationTime = timestamps.get(user.id) + cooldownAmount;

				if (now < expirationTime) {
					const timeLeft = ((expirationTime - now) / 1000).toFixed(0);
					return interaction.reply({
						content: `🛑 **|** That command is on cooldown! Wait ${timeLeft} second(s) before using it again.`,
						ephemeral: true,
					});
				}
			}

			timestamps.set(user.id, now);
			setTimeout(() => timestamps.delete(user.id), cooldownAmount);
		}

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`Failed to execute command ${commandName}
* ${error}`);

			interaction.reply({
				content:
					"❌ **|** Something went wrong while executing that command. Report this with `/bugs`!",
				ephemeral: true,
			});
		}
	},
};
