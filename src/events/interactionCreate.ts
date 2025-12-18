import { Collection, type Interaction } from "discord.js";
import commands from "../commands";

const cooldowns = new Collection<string, Collection<string, number>>();

const admins = process.env.DISCORD_ADMIN_ID?.split(" ");

export default async function interactionCreate(interaction: Interaction) {
	if (!interaction.isCommand() && !interaction.isContextMenuCommand()) return;

	const { commandName, user } = interaction;

	const command = commands[commandName];
	if (!command) return;

	const isAdmin = admins?.includes(user.id);

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
				interaction.reply({
					content: `🛑 **|** That command is on cooldown! Wait ${timeLeft} second(s) before using it again.`,
					ephemeral: true,
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
			interaction.editReply({
				content:
					"❌ **|** Something went wrong while executing that command. Report this with `/bugs`!",
			});
		} else {
			interaction.reply({
				content:
					"❌ **|** Something went wrong while executing that command. Report this with `/bugs`!",
				ephemeral: true,
			});
		}
	}
}
