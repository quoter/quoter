import { Collection, type Interaction, MessageFlags } from "discord.js";
import { commands } from "@/commands";
import { handleListQuoteButtonPress } from "@/commands/list-quotes";
import { getConfig } from "@/config";
import { ensureGuild } from "@/db";

const cooldowns = new Collection<string, Collection<string, number>>();
const errorMessage =
	"❌ **|** Something went wrong while executing that command. Report this with `/bugs`!";

export async function interactionCreate(
	interaction: Interaction,
): Promise<void> {
	if (
		!interaction.isButton() &&
		!interaction.isCommand() &&
		!interaction.isContextMenuCommand()
	) {
		return;
	}

	try {
		if (interaction.guildId) ensureGuild(interaction.guildId);

		if (interaction.isButton()) {
			await handleListQuoteButtonPress(interaction);
			return;
		}

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

			if (lastUsedAt && now < lastUsedAt + cooldownAmount) {
				const timeLeft = ((lastUsedAt + cooldownAmount - now) / 1000).toFixed(
					0,
				);
				await interaction.reply({
					content: `🛑 **|** That command is on cooldown! Wait ${timeLeft} second(s) before using it again.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}

			timestamps.set(user.id, now);
			setTimeout(() => timestamps.delete(user.id), cooldownAmount);
		}

		await command.execute(interaction);
	} catch (error) {
		const interactionName = interaction.isButton()
			? `button ${interaction.customId}`
			: `command ${interaction.commandName}`;
		console.error(`Failed to execute ${interactionName}`, error);

		try {
			if (interaction.deferred || interaction.replied) {
				await interaction.editReply({ content: errorMessage });
			} else {
				await interaction.reply({
					content: errorMessage,
					flags: MessageFlags.Ephemeral,
				});
			}
		} catch (replyError) {
			console.error(`Failed to report ${interactionName} error`, replyError);
		}
	}
}
