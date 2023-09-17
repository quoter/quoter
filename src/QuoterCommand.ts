import {
	CommandInteraction,
	ContextMenuCommandBuilder,
	Interaction,
	SlashCommandBuilder,
} from "discord.js";

export default interface QuoterCommand {
	data: SlashCommandBuilder | ContextMenuCommandBuilder;
	cooldown?: number;
	execute(interaction: CommandInteraction): Promise<void>;
}

// export default QuoterCommand;
