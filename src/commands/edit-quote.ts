import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { maxQuoteLength } from "@/lib/quote-limits";
import { getQuote, updateQuote } from "@/lib/quotes";
import { cleanString, mentionParse, trimQuotes } from "@/lib/utils";

const EditQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("edit-quote")
		.setDescription("Edit a quote's text or change its author")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to edit")
				.setRequired(true),
		)
		.addStringOption((o) =>
			o
				.setName("text")
				.setDescription("The updated text of the quote")
				.setRequired(true),
		)
		.addStringOption((o) =>
			o.setName("author").setDescription("The updated author of the quote"),
		)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	cooldown: 10,
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

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author, interaction.client);

		const textInput = interaction.options.getString("text");
		if (textInput === null) throw new Error("Text input is null");
		const text = trimQuotes(textInput);

		if (text.length > maxQuoteLength) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${maxQuoteLength} characters.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await updateQuote(quote.id, {
			text,
			author: author || quote.author,
			editedTimestamp: Date.now(),
			editorID: interaction.user.id,
		});

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("✅ Edited quote")
					.setColor(Colors.Green)
					.setDescription(
						`"${cleanString(text, false)}"${
							author ? ` - ${cleanString(author, false)}` : ""
						}`,
					)
					.setFooter({ text: `Quote #${quoteId}` }),
			],
		});
	},
};

export default EditQuoteCommand;
