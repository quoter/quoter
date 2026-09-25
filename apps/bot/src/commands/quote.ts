import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getQuote, getRandomQuote } from "@/db";
import { getGuildId } from "@/lib/guild";
import { cleanString } from "@/lib/utils";

const QuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("quote")
		.setDescription("View a random or specific quote")
		.addIntegerOption((o) =>
			o.setName("id").setDescription("The ID of the quote to view"),
		)
		.addStringOption((o) =>
			o
				.setName("author")
				.setDescription(
					"The author to randomly select a quote from (case-insensitive)",
				),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 2,
	async execute(interaction: ChatInputCommandInteraction) {
		const choice = interaction.options.getInteger("id");
		const author = interaction.options.getString("author");

		if (choice && author) {
			await interaction.reply({
				content: "❌ **|** You can't specify both an ID and an author.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const guildId = getGuildId(interaction);
		const quote = choice
			? getQuote(guildId, choice)
			: getRandomQuote(guildId, author);

		if (!quote) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored, or none by that author. Use `/create-quote` to create one!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setDescription(`"${cleanString(quote.text, false)}"`)
			.setFooter({
				text: `Quote #${quote.quoteNumber}${!choice ? " (random)" : ""}`,
			});

		if (quote.originalMessageId && quote.originalChannelId) {
			embed.setDescription(
				embed.data.description +
					`\n> [Original Message](https://discord.com/channels/${guildId}/${quote.originalChannelId}/${quote.originalMessageId})`,
			);
		}

		embed.setTimestamp(quote.editedAt ?? quote.createdAt);

		if (quote.author) embed.setAuthor({ name: quote.author });

		await interaction.reply({ embeds: [embed] });
	},
};

export default QuoteCommand;
