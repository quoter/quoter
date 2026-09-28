import {
	type ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { deleteQuote, getQuote } from "@/db";
import { getGuildId } from "@/lib/guild";

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
		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		const guildId = getGuildId(interaction);
		const quote = getQuote(guildId, id);

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (quote.quoterId !== interaction.user.id) {
			await interaction.reply({
				content:
					"❌ **|** You can only delete quotes that you created. If you have permission to use `/delete-quote`, you can use that to delete any quote.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		deleteQuote(guildId, id);
		await interaction.reply({
			content: `✅ **|** Deleted quote #${id}.`,
		});
	},
};

export default DeleteOwnQuoteCommand;
