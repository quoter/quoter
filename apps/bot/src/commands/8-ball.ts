import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getRandomQuote } from "@/db";
import { getGuildId } from "@/lib/guild";
import { cleanString } from "@/lib/utils";

const EightBallCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("8-ball")
		.setDescription(
			"Ask the magic 8-ball a question, and receive a quote in response",
		)
		.addStringOption((o) =>
			o
				.setName("question")
				.setDescription("The question to ask the magic 8-ball")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 2,
	async execute(interaction: ChatInputCommandInteraction) {
		const question = interaction.options.getString("question");
		if (question === null) throw new Error("Question is null");

		const questionEmbed = new EmbedBuilder()
			.setColor(Colors.Purple)
			.setTitle("🎱 Magic 8-Ball")
			.setDescription(
				`You ask the magic 8-ball a question...\n\n> ${question}\n\n...and it responds with a quote:`,
			);

		const guildId = getGuildId(interaction);
		const quote = getRandomQuote(guildId);
		if (!quote) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored, or none by that author. Use `/create-quote` to create one!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const quoteEmbed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setDescription(`"${cleanString(quote.text, false)}"`)
			.setFooter({ text: `Quote #${quote.quoteNumber}` });

		if (quote.originalMessageId && quote.originalChannelId) {
			quoteEmbed.setDescription(
				quoteEmbed.data.description +
					`\n> [Original Message](https://discord.com/channels/${guildId}/${quote.originalChannelId}/${quote.originalMessageId})`,
			);
		}

		quoteEmbed.setTimestamp(quote.editedAt ?? quote.createdAt);

		if (quote.author) quoteEmbed.setAuthor({ name: quote.author });

		await interaction.reply({ embeds: [questionEmbed, quoteEmbed] });
	},
};

export default EightBallCommand;
