/*
Copyright (C) 2020-2023 Nick Oates

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

import { Collection, Interaction } from "discord.js";
import commands from "../commands";

const cooldowns = new Collection<string, Collection<string, number>>();

const admins = process.env.DISCORD_ADMIN_ID?.split(" ");

export default async function interactionCreate(interaction: Interaction) {
	if (!interaction.isCommand() && !interaction.isContextMenuCommand()) return;

	const { commandName, user } = interaction;

	const command = commands[commandName];
	if (!command) return;

	const isAdmin = admins !== undefined && admins.includes(user.id);

	if (command.cooldown && !isAdmin) {
		if (!cooldowns.has(commandName)) {
			cooldowns.set(commandName, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(commandName);
		const cooldownAmount = command.cooldown * 1000;

		const lastUsedAt = timestamps!.get(user.id);
		if (lastUsedAt) {
			const expirationTime = lastUsedAt + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = ((expirationTime - now) / 1000).toFixed(0);
				interaction.reply({
					content: `🛑 **|** That command is on cooldown! Wait ${timeLeft} second(s) before using it again.`,
					ephemeral: true,
				});
				return;
			}
		}

		timestamps!.set(user.id, now);
		setTimeout(() => timestamps!.delete(user.id), cooldownAmount);
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
}
