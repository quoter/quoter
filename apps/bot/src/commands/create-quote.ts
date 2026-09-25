import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import type { Quote } from "@/db";
import { createQuote, GuildQuoteLimitError } from "@/db";
import { getGuildId, getGuildLimits } from "@/lib/guild";
import { cleanString, mentionParse, trimQuotes } from "@/lib/utils";

const CreateQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("create-quote")
		.setDescription("Create a new quote in this server's quote book")
		.addStringOption((o) =>
			o
				.setName("text")
				.setDescription("The text of the quote")
				.setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("author").setDescription("The author of the quote"),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 10,
	async execute(interaction: ChatInputCommandInteraction) {
		const guildId = getGuildId(interaction);
		const limits = getGuildLimits(guildId);

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author, interaction.client);

		let text = interaction.options.getString("text");
		if (text === null) throw new Error("Text is null or empty");
		text = trimQuotes(text);

		if (text.length > limits.maxQuoteLength) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${limits.maxQuoteLength} characters.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		let quote: Quote;
		try {
			quote = createQuote(
				guildId,
				{ text, author, quoterId: interaction.user.id },
				limits.maxQuotes,
			);
		} catch (error) {
			if (!(error instanceof GuildQuoteLimitError)) throw error;
			await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Ask for this limit to be raised in the [Quoter support server](https://discord.gg/QzXTgS2CNk), or use `/delete-quote` before creating more.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setTitle("✅ Created a new quote")
			.setColor(Colors.Green)
			.setDescription(`"${cleanString(text, false)}"`)
			.setFooter({ text: `Quote #${quote.quoteNumber}` });

		if (author) {
			embed.setDescription(
				`${embed.data.description} - ${cleanString(author)}`,
			);
		}

		await interaction.reply({ embeds: [embed] });
	},
};

export default CreateQuoteCommand;
