import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getAllQuotes } from "@/lib/quotes";

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

		const allQuotes = await getAllQuotes(interaction.guild.id);

		if (!allQuotes.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");
		const quote = allQuotes[id - 1];
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
					.setDescription(`Quote #${id} was created by <@${quote.quoterID}>.`),
			],
		});
	},
};

export default WhoQuotedCommand;
