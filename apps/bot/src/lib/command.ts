import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
} from "discord.js";

const customIdSeparator = ":";

interface BaseCommand {
  /** Per-user cooldown in seconds. Admins are exempt. */
  cooldown?: number;
  /**
   * Handles presses of buttons whose custom ID was built with
   * `buildCustomId(<command name>, ...args)`.
   */
  onButton?: (interaction: ButtonInteraction, args: string[]) => Promise<void>;
}

export interface SlashCommand extends BaseCommand {
  kind: "slash";
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

export interface MessageContextMenuCommand extends BaseCommand {
  kind: "message-context-menu";
  data: ContextMenuCommandBuilder;
  execute: (interaction: MessageContextMenuCommandInteraction) => Promise<void>;
}

export type QuoterCommand = SlashCommand | MessageContextMenuCommand;

export function defineSlashCommand(
  command: Omit<SlashCommand, "kind">
): SlashCommand {
  return { ...command, kind: "slash" };
}

export function defineMessageContextMenuCommand(
  command: Omit<MessageContextMenuCommand, "kind">
): MessageContextMenuCommand {
  return { ...command, kind: "message-context-menu" };
}

/** Builds a button custom ID that is routed to the command's `onButton`. */
export function buildCustomId(
  commandName: string,
  ...args: (string | number)[]
): string {
  return [commandName, ...args].join(customIdSeparator);
}

export function parseCustomId(customId: string): {
  commandName: string;
  args: string[];
} {
  const [commandName = "", ...args] = customId.split(customIdSeparator);
  return { args, commandName };
}
