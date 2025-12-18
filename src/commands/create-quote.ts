import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { maxGuildQuotes, maxQuoteLength } from "@/lib/quote-limits";
import {
	cleanString,
	fetchDbGuild,
	mentionParse,
	trimQuotes,
} from "@/lib/utils";
import { Quote } from "@/schemas/guild";

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
		const guild = await fetchDbGuild(interaction);

		if (guild.quotes.length >= (guild.maxGuildQuotes || maxGuildQuotes)) {
			await interaction.reply({
				content:
					"❌ **|** This server has too many quotes! Ask for this limit to be raised in the [Quoter support server](https://discord.gg/QzXTgS2CNk), or use `/delete-quote` before creating more.",
				ephemeral: true,
			});
			return;
		}

		let author = interaction.options.getString("author");
		author &&= await mentionParse(author, interaction.client);

		let text = interaction.options.getString("text");
		if (text === null) throw new Error("Text is null or empty");
		text = trimQuotes(text);

		if (text.length > (guild.maxQuoteLength || maxQuoteLength)) {
			await interaction.reply({
				content: `❌ **|** Quotes cannot be longer than ${
					guild.maxQuoteLength || maxQuoteLength
				} characters.`,
				ephemeral: true,
			});
			return;
		}

		const quote = new Quote({
			text,
			author,
			quoterID: interaction.user.id,
		});

		guild.quotes.push(quote);

		await guild.save();

		const embed = new EmbedBuilder()
			.setTitle("✅ Created a new quote")
			.setColor(Colors.Green)
			.setDescription(`"${cleanString(text, false)}"`)
			.setFooter({ text: `Quote #${guild.quotes.length}` });

		if (author) {
			embed.setDescription(
				`${embed.data.description} - ${cleanString(author)}`,
			);
		}

		await interaction.reply({ embeds: [embed] });
	},
};

export default CreateQuoteCommand;
