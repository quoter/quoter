import {
	EmbedBuilder,
	SlashCommandBuilder,
	Colors,
	PermissionFlagsBits,
	ChatInputCommandInteraction,
	InteractionContextType,
} from "discord.js";
import mentionParse from "../util/mentionParse";
import trimQuotes from "../util/trimQuotes";
import cleanString from "../util/cleanString";
import { QuoterCommand } from "../QuoterCommand";
import fetchDbGuild from "../util/fetchDbGuild";
import { maxQuoteLength } from "../util/quoteLimits";

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
			o
				.setName("author")
				.setDescription("The updated author of the quote"),
		)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	cooldown: 10,
	async execute(interaction: ChatInputCommandInteraction) {
		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		const guild = await fetchDbGuild(interaction);

		const { quotes } = guild;
		const quote = quotes[id - 1];

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
			return;
		}

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author, interaction.client);

		const textInput = interaction.options.getString("text");
		if (textInput === null) throw new Error("Text input is null");
		const text = trimQuotes(textInput);

		if (text.length > (guild.maxQuoteLength || maxQuoteLength)) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${
					guild.maxQuoteLength || maxQuoteLength
				} characters.`,
				ephemeral: true,
			});
			return;
		}

		quote.text = text;
		if (author) quote.author = author;
		quote.editedTimestamp = Date.now();
		quote.editorID = interaction.user.id;

		await guild.save();

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

export default EditQuoteCommand;
