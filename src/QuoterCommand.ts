import type {
	CommandInteraction,
	ContextMenuCommandBuilder,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export type QuoterCommand = {
	data:
		| SlashCommandBuilder
		| ContextMenuCommandBuilder
		| SlashCommandOptionsOnlyBuilder;
	cooldown?: number;
	execute(interaction: CommandInteraction): Promise<void>;
};
