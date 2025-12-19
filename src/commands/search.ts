import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import Fuse from "fuse.js";
import type { QuoterCommand } from "@/commands";
import { cleanString, fetchDbGuild } from "@/lib/utils";

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
		const { quotes } = await fetchDbGuild(interaction);

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

		const fuse = new Fuse(quotes, {
			keys: ["text", "author"],
			threshold: 0.4,
		});
		const matches = fuse.search(searchTerm);

		if (!matches.length) {
			await interaction.reply({
				content:
					"❌ **|** There weren't any quotes that matched that search term.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		matches.length = 5;

		const list = matches.map((match) => {
			let result = "";

			const quoteID = match.refIndex + 1;
			const quote = match.item;

			if (quote.text && quote.text.length > 30) {
				quote.text = `${quote.text.substr(0, 30)}...`;
			}
			if (quote.author && quote.author.length > 10) {
				quote.author = `${quote.author.substr(0, 10)}...`;
			}

			result += `**${quoteID}**. "${cleanString(quote.text)}"`;

			if (quote.author && quote.author.length > 0) {
				result += ` - ${cleanString(quote.author)}`;
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
