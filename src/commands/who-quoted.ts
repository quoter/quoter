import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getQuote } from "@/lib/quotes";

const WhoQuotedCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("who-quoted")
		.setDescription("See who created a specific quote")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to view")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 2,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			throw new Error("Interaction is not in a guild.");
		}

		const quoteId = interaction.options.getInteger("id");
		if (quoteId === null) throw new Error("ID is null");

		const quote = await getQuote(interaction.guild.id, quoteId);

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Green)
					.setDescription(
						`Quote #${quoteId} was created by <@${quote.quoterID}>.`,
					),
			],
		});
	},
};

export default WhoQuotedCommand;
