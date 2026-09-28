import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getSearchCandidates } from "@/db";
import { getGuildId } from "@/lib/guild";
import { searchQuotes } from "@/lib/search-quotes";
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
		const quotes = getSearchCandidates(getGuildId(interaction));

		if (!quotes.length) {
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

		const matches = searchQuotes(quotes, searchTerm);

		if (!matches.length) {
			await interaction.reply({
				content:
					"❌ **|** There weren't any quotes that matched that search term.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const list = matches.map((quote) => {
			const text =
				quote.text.length > 30
					? `${quote.text.substring(0, 30)}...`
					: quote.text;
			const author =
				quote.author && quote.author.length > 10
					? `${quote.author.substring(0, 10)}...`
					: quote.author;
			return `**${quote.quoteNumber}**. "${cleanString(text)}"${
				author ? ` - ${cleanString(author)}` : ""
			}`;
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
