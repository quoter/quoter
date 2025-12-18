import {
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { cleanString, fetchDbGuild } from "@/lib/utils";

const QuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("quote")
		.setDescription("View a random or specific quote")
		.addIntegerOption((o) =>
			o.setName("id").setDescription("The ID of the quote to view"),
		)
		.addStringOption((o) =>
			o
				.setName("author")
				.setDescription(
					"The author to randomly select a quote from (case-insensitive)",
				),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 2,
	async execute(interaction: ChatInputCommandInteraction) {
		const choice = interaction.options.getInteger("id");
		const author = interaction.options.getString("author");

		if (choice && author) {
			await interaction.reply({
				content: "❌ **|** You can't specify both an ID and an author.",
				ephemeral: true,
			});
			return;
		}

		const { quotes } = await fetchDbGuild(interaction);

		if (!quotes?.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored, or none by that author. Use `/create-quote` to create one!",
				ephemeral: true,
			});
			return;
		}

		const filteredQuotes = author
			? quotes.filter(
					(q) => q.author && q.author.toLowerCase() === author.toLowerCase(),
				)
			: quotes;

		const id = choice ?? Math.ceil(Math.random() * filteredQuotes.length);

		const quote = filteredQuotes[id - 1];
		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setDescription(`"${cleanString(quote.text, false)}"`)
			.setFooter({ text: `Quote #${id}${!choice ? " (random)" : ""}` });

		if (interaction.guild === null) throw new Error("Guild is null");
		if (quote.ogMessageID && quote.ogChannelID) {
			embed.setDescription(
				embed.data.description +
					`\n> [Original Message](https://discord.com/channels/${interaction.guild.id}/${quote.ogChannelID}/${quote.ogMessageID})`,
			);
		}

		if (quote.createdTimestamp) {
			embed.setTimestamp(quote.editedTimestamp || quote.createdTimestamp);
		}

		if (quote.author) embed.setAuthor({ name: quote.author });

		await interaction.reply({ embeds: [embed] });
	},
};

export default QuoteCommand;
