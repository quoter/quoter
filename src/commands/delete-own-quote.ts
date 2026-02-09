import {
	type ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { deleteQuote, getAllQuotes } from "@/lib/quotes";

const DeleteOwnQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("delete-own-quote")
		.setDescription("Delete a quote that you created")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to delete")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 5,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			throw new Error("Interaction is not in a guild.");
		}

		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		const allQuotes = await getAllQuotes(interaction.guild.id);
		const quote = allQuotes[id - 1];

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (quote.quoterID !== interaction.user.id) {
			await interaction.reply({
				content:
					"❌ **|** You can only delete quotes that you created. If you have permission to use `/delete-quote`, you can use that to delete any quote.",
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

export default DeleteOwnQuoteCommand;
