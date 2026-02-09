import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { maxQuoteLength } from "@/lib/quote-limits";
import { getAllQuotes, updateQuote } from "@/lib/quotes";
import { cleanString, mentionParse, trimQuotes } from "@/lib/utils";

const EditOwnQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("edit-own-quote")
		.setDescription("Edit a quote that you created")
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
		.setContexts(InteractionContextType.Guild),
	cooldown: 10,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			throw new Error("Interaction is not in a guild.");
		}

		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		const allQuotes = await getAllQuotes(interaction.guild.id);
		const quote = allQuotes[id - 1];

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (quote.quoterID !== interaction.user.id) {
			await interaction.reply({
				content:
					"❌ **|** You can only edit quotes that you created. If you have permission to use `/edit-quote`, you can use that to edit any quote.",
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
					.setFooter({ text: `Quote #${id}` }),
			],
		});
	},
};

export default EditOwnQuoteCommand;
