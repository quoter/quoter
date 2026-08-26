import { Collection, type Interaction, MessageFlags } from "discord.js";
import { commands } from "@/commands";
import { handleListQuoteButtonPress } from "@/commands/list-quotes";
import { getConfig } from "@/config";
import { getStore } from "@/db";

const cooldowns = new Collection<string, Collection<string, number>>();

export async function interactionCreate(interaction: Interaction) {
	if (interaction.guildId) getStore().ensureGuild(interaction.guildId);

	if (interaction.isButton()) {
		await handleListQuoteButtonPress(interaction);
		return;
	}

	if (!interaction.isCommand() && !interaction.isContextMenuCommand()) return;

	const { commandName, user } = interaction;

	const command = commands[commandName];
	if (!command) return;

	const isAdmin = getConfig().discordAdminIds.has(user.id);

	if (command.cooldown && !isAdmin) {
		if (!cooldowns.has(commandName)) {
			cooldowns.set(commandName, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(commandName);
		if (!timestamps) throw new Error("Timestamps missing");
		const cooldownAmount = command.cooldown * 1000;

		const lastUsedAt = timestamps.get(user.id);
		if (lastUsedAt) {
			const expiresAt = lastUsedAt + cooldownAmount;

			if (now < expiresAt) {
				const timeLeft = ((expiresAt - now) / 1000).toFixed(0);
				await interaction.reply({
					content: `🛑 **|** That command is on cooldown! Wait ${timeLeft} second(s) before using it again.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
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

		if (interaction.deferred || interaction.replied) {
			await interaction.editReply({
				content:
					"❌ **|** Something went wrong while executing that command. Report this with `/bugs`!",
			});
		} else {
			await interaction.reply({
				content:
					"❌ **|** Something went wrong while executing that command. Report this with `/bugs`!",
				flags: MessageFlags.Ephemeral,
			});
		}
	}
}
