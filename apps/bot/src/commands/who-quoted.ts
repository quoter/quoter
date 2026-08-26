import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getStore } from "@/db";
import { getGuildId } from "@/lib/guild";

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
		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");
		const quote = getStore().getQuote(getGuildId(interaction), id);
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
						quote.quoterId
							? `Quote #${id} was created by <@${quote.quoterId}>.`
							: `The creator of quote #${id} is unknown.`,
					),
			],
		});
	},
};

export default WhoQuotedCommand;
