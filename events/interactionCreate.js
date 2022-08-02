/*
Copyright (C) 2020-2022 Nicholas Christopher

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
const Guild = require("../schemas/guild.js");

const cooldowns = new Collection();

module.exports = {
	name: "interactionCreate",
	once: false,
	async execute(interaction, client) {
		const { commandName, user, member } = interaction;

		if (!interaction.isCommand() && !interaction.isContextMenuCommand()) {
			return;
		}

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

		const isAdmin = client.admins.includes(user.id);

		if (!isAdmin && command.cooldown) {
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

		if (!isAdmin && command.permission) {
			const isManager =
				member.permissions.has("MANAGE_GUILD") ||
				member.roles.cache.some(
					(r) => r.name.toLowerCase() === "quote manager"
				);

			if (command.permission === "create") {
				const { allQuote } = (interaction.db ??=
					await Guild.findOneAndUpdate(
						{ _id: interaction.guild.id },
						{},
						{ upsert: true, new: true }
					));

				if (!allQuote && !isManager) {
					return await interaction.reply({
						content: `✋ **|** That action requires the **Manage Guild** permission.
		
**❗ To allow anyone to create quotes**, have an admin use \`/allquote\`.`,
						ephemeral: true,
					});
				}
			} else if (command.permission === "manageSelf") {
				const { manageSelf, quotes } = (interaction.db ??=
					await Guild.findOneAndUpdate(
						{ _id: interaction.guild.id },
						{},
						{ upsert: true, new: true }
					));

				const id = interaction.options.getInteger("id");
				const createdQuote =
					quotes[id - 1]?.quoterID === interaction.user.id;

				if (!isManager && !(manageSelf && createdQuote)) {
					return await interaction.reply({
						content: `✋ **|** That action requires the **Manage Guild** permission.
		
**❗ To allow users to delete/edit quotes they've created**, have an admin use \`/manageself\`.`,
						ephemeral: true,
					});
				}
			} else if (command.permission === "manage") {
				if (!isManager) {
					return await interaction.reply({
						content:
							"✋ **|** That action requires the **Manage Guild** permission.",
						ephemeral: true,
					});
				}
			}
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
