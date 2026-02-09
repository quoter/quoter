import {
	type ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { deleteQuote, getQuote } from "@/lib/quotes";

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

		const quoteId = interaction.options.getInteger("id");
		if (quoteId === null) throw new Error("ID is null");

		// Get the quote by its quoteId
		const quote = await getQuote(interaction.guild.id, quoteId);

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await deleteQuote(quote.id);
		await interaction.reply({
			content: `✅ **|** Deleted quote #${quoteId}.`,
		});
	},
};

export default DeleteQuoteCommand;
