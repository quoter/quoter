import {
	ApplicationCommandType,
	Colors,
	ContextMenuCommandBuilder,
	EmbedBuilder,
	InteractionContextType,
	type MessageContextMenuCommandInteraction,
	MessageFlags,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import type { Quote } from "@/db";
import { createQuote, GuildQuoteLimitError } from "@/db";
import { getGuildId, getGuildLimits } from "@/lib/guild";
import { cleanString } from "@/lib/utils";

const QuoteThisCommand: QuoterCommand = {
	data: new ContextMenuCommandBuilder()
		.setName("Quote This")
		.setType(ApplicationCommandType.Message)
		.setContexts(InteractionContextType.Guild),
	cooldown: 10,
	async execute(interaction: MessageContextMenuCommandInteraction) {
		const guildId = getGuildId(interaction);
		const limits = getGuildLimits(guildId);

		const message = interaction.options.getMessage("message");
		if (!message) throw new Error("No message found");

		const text = message.content;
		if (!text) {
			await interaction.reply({
				content: `❌ **|** [That message](${message.url}) doesn't contain text - embeds are not supported!`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (text.length > limits.maxQuoteLength) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${limits.maxQuoteLength} characters.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const author = message.author?.tag;

		let quote: Quote;
		try {
			quote = createQuote(
				guildId,
				{
					text,
					author,
					originalMessageId: message.id,
					originalChannelId: message.channel.id,
					quoterId: interaction.user.id,
				},
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

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("✅ Created a new quote")
					.setColor(Colors.Green)
					.setDescription(
						`"${cleanString(text, false)}" - ${cleanString(author)}`,
					)
					.setFooter({ text: `Quote #${quote.quoteNumber}` }),
			],
		});
	},
};

export default QuoteThisCommand;
