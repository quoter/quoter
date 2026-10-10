import { Collection, MessageFlags } from "discord.js";
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Interaction,
  MessageContextMenuCommandInteraction,
} from "discord.js";

import { commands } from "@/commands";
import { getConfig } from "@/config";
import { ensureGuild } from "@/db";
import { parseCustomId } from "@/lib/command";

type CommandInteraction =
  | ChatInputCommandInteraction
  | MessageContextMenuCommandInteraction;

const cooldowns = new Collection<string, Collection<string, number>>();
const errorMessage =
  "❌ **|** Something went wrong while executing that command. Report this with `/bugs`!";

/** Returns the seconds left on the user's cooldown, or 0 if they can proceed. */
function takeCooldown(
  commandName: string,
  userId: string,
  cooldownSeconds: number
): number {
  let timestamps = cooldowns.get(commandName);
  if (!timestamps) {
    timestamps = new Collection();
    cooldowns.set(commandName, timestamps);
  }

  const now = Date.now();
  const cooldownAmount = cooldownSeconds * 1000;
  const lastUsedAt = timestamps.get(userId);
  if (lastUsedAt && now < lastUsedAt + cooldownAmount) {
    return Math.round((lastUsedAt + cooldownAmount - now) / 1000);
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return 0;
}

async function handleButton(interaction: ButtonInteraction): Promise<void> {
  const { commandName, args } = parseCustomId(interaction.customId);
  await commands[commandName]?.onButton?.(interaction, args);
}

async function handleCommand(interaction: CommandInteraction): Promise<void> {
  const { commandName, user } = interaction;
  const command = commands[commandName];
  if (!command) {
    return;
  }

  if (command.cooldown && !getConfig().discordAdminIds.has(user.id)) {
    const timeLeft = takeCooldown(commandName, user.id, command.cooldown);
    if (timeLeft > 0) {
      await interaction.reply({
        content: `🛑 **|** That command is on cooldown! Wait ${timeLeft} second(s) before using it again.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
  }

  if (command.kind === "slash" && interaction.isChatInputCommand()) {
    await command.execute(interaction);
  } else if (
    command.kind === "message-context-menu" &&
    interaction.isMessageContextMenuCommand()
  ) {
    await command.execute(interaction);
  } else {
    throw new Error(
      `Command ${commandName} (${command.kind}) received a mismatched interaction`
    );
  }
}

export async function interactionCreate(
  interaction: Interaction
): Promise<void> {
  if (
    !interaction.isButton() &&
    !interaction.isChatInputCommand() &&
    !interaction.isMessageContextMenuCommand()
  ) {
    return;
  }

  try {
    if (interaction.guildId) {
      ensureGuild(interaction.guildId);
    }

    await (interaction.isButton()
      ? handleButton(interaction)
      : handleCommand(interaction));
  } catch (error) {
    const interactionName = interaction.isButton()
      ? `button ${interaction.customId}`
      : `command ${interaction.commandName}`;
    console.error(`Failed to execute ${interactionName}`, error);

    try {
      await (interaction.deferred || interaction.replied
        ? interaction.editReply({ content: errorMessage })
        : interaction.reply({
            content: errorMessage,
            flags: MessageFlags.Ephemeral,
          }));
    } catch (replyError) {
      console.error(`Failed to report ${interactionName} error`, replyError);
    }
  }
}
