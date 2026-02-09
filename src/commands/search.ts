import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getAllQuotes, searchQuotes } from "@/lib/quotes";
import { cleanString } from "@/lib/utils";

const SearchCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("search")
		.setDescription("Search through this server's quote book")
		.addStringOption((o) =>
			o
				.setName("term")
				.setDescription("The query to search for")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 5,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			throw new Error("Interaction is not in a guild.");
		}

		const allQuotes = await getAllQuotes(interaction.guild.id);

		if (!allQuotes.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const searchTerm = interaction.options.getString("term");
		if (!searchTerm) throw new Error("Search term is empty or null");

		if (searchTerm.length < 3) {
			await interaction.reply({
				content:
					"❌ **|** That search term is too short! It should be at least 3 characters long.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const matches = await searchQuotes(interaction.guild.id, searchTerm, 5);

		if (!matches.length) {
			await interaction.reply({
				content:
					"❌ **|** There weren't any quotes that matched that search term.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const list = matches.map((quote) => {
			// Find the quote ID by its position in all quotes
			const quoteID = allQuotes.findIndex((q) => q.id === quote.id) + 1;

			let text = quote.text;
			let author = quote.author;

			if (text && text.length > 30) {
				text = `${text.substring(0, 30)}...`;
			}
			if (author && author.length > 10) {
				author = `${author.substring(0, 10)}...`;
			}

			let result = `**${quoteID}**. "${cleanString(text)}"`;

			if (author && author.length > 0) {
				result += ` - ${cleanString(author)}`;
			}

			return result;
		});

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("🔎 Search Results")
					.setColor(Colors.Blue)
					.setDescription(`Use \`/quote <ID>\` to view a specific quote.

${list.join("\n")}`),
			],
		});
	},
};

export default SearchCommand;
