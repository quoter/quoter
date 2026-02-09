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
import { maxGuildQuotes, maxQuoteLength } from "@/lib/quote-limits";
import { createQuote, ensureGuild, getQuoteCount } from "@/lib/quotes";
import { cleanString } from "@/lib/utils";

const QuoteThisCommand: QuoterCommand = {
	data: new ContextMenuCommandBuilder()
		.setName("Quote This")
		.setType(ApplicationCommandType.Message)
		.setContexts(InteractionContextType.Guild),
	cooldown: 10,
	async execute(interaction: MessageContextMenuCommandInteraction) {
		if (!interaction.guild) {
			throw new Error("Interaction is not in a guild.");
		}

		const guild = await ensureGuild(interaction.guild.id);
		const quoteCount = await getQuoteCount(interaction.guild.id);

		if (quoteCount >= (guild.maxGuildQuotes || maxGuildQuotes)) {
			await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Ask for this limit to be raised in the [Quoter support server](https://discord.gg/QzXTgS2CNk), or use `/delete-quote` before creating more.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

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

		if (text.length > maxQuoteLength) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${maxQuoteLength} characters.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const author = message.author?.tag;

		const quote = await createQuote(interaction.guild.id, {
			text,
			author,
			ogMessageID: message.id,
			ogChannelID: message.channel.id,
			quoterID: interaction.user.id,
		});

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("✅ Created a new quote")
					.setColor(Colors.Green)
					.setDescription(
						`"${cleanString(text, false)}" - ${cleanString(author)}`,
					)
					.setFooter({ text: `Quote #${quote.quoteId}` }),
			],
		});
	},
};

export default QuoteThisCommand;
