import {
	type ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { deleteQuote, getAllQuotes } from "@/lib/quotes";

const DeleteQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("delete-quote")
		.setDescription("Delete a quote from this server's quote book")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to delete")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	cooldown: 5,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			throw new Error("Interaction is not in a guild.");
		}

		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		// Get all quotes to find the one at the 1-indexed position
		const allQuotes = await getAllQuotes(interaction.guild.id);
		const quote = allQuotes[id - 1];

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await deleteQuote(quote.id);
		await interaction.reply({
			content: `✅ **|** Deleted quote #${id}.`,
		});
	},
};

export default DeleteQuoteCommand;
