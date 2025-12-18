import {
	ApplicationCommandType,
	Colors,
	ContextMenuCommandBuilder,
	EmbedBuilder,
	InteractionContextType,
	type MessageContextMenuCommandInteraction,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { maxGuildQuotes, maxQuoteLength } from "@/lib/quote-limits";
import { cleanString, fetchDbGuild } from "@/lib/utils";
import { Quote } from "@/schemas/guild";

const QuoteThisCommand: QuoterCommand = {
	data: new ContextMenuCommandBuilder()
		.setName("Quote This")
		.setType(ApplicationCommandType.Message)
		.setContexts(InteractionContextType.Guild),
	cooldown: 10,
	async execute(interaction: MessageContextMenuCommandInteraction) {
		const guild = await fetchDbGuild(interaction);

		if (guild.quotes.length >= (guild.maxGuildQuotes || maxGuildQuotes)) {
			await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Ask for this limit to be raised in the [Quoter support server](https://discord.gg/QzXTgS2CNk), or use `/delete-quote` before creating more.",
				ephemeral: true,
			});
			return;
		}

		const message = interaction.options.getMessage("message");
		if (!message) throw new Error("No message found");

		const text = message.content;
		if (!text) {
			await interaction.reply({
				content: `❌ **|** [That message](${message.url}) doesn't contain text - embeds are not supported!`,
				ephemeral: true,
			});
			return;
		}

		if (text.length > (guild.maxQuoteLength || maxQuoteLength)) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${maxQuoteLength} characters.`,
				ephemeral: true,
			});
			return;
		}

		const author = message.author?.tag;

		const quote = new Quote({
			text,
			author,
			ogMessageID: message.id,
			ogChannelID: message.channel.id,
			quoterID: interaction.user.id,
		});

		guild.quotes.push(quote);
		await guild.save();

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("✅ Created a new quote")
					.setColor(Colors.Green)
					.setDescription(
						`"${cleanString(text, false)}" - ${cleanString(author)}`,
					)
					.setFooter({ text: `Quote #${guild.quotes.length}` }),
			],
		});
	},
};

export default QuoteThisCommand;
