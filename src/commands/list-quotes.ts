import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	InteractionContextType,
	type InteractionReplyOptions,
	type InteractionUpdateOptions,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { getQuoteCount, getQuotes } from "@/lib/quotes";
import { cleanString } from "@/lib/utils";

export async function handleListQuoteButtonPress(
	interaction: ButtonInteraction,
) {
	const match = interaction.customId.match(/listquotes_u(\d+)p(\d+)/);
	if (!match) return;
	const userId = match[1];
	const page = Number.parseInt(match[2], 10);

	if (interaction.user.id !== userId) {
		await interaction.reply({
			content: "❌ **|** These buttons are not for you!",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	if (!interaction.guild) {
		await interaction.reply({
			content: "❌ **|** This command can only be used in a server.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}

	const quoteList = await renderQuoteList({
		page,
		userId,
		guildId: interaction.guild.id,
	});
	await interaction.update(quoteList);
}

export async function renderQuoteList({
	page,
	guildId,
	userId,
}: {
	page: number;
	guildId: string;
	userId: string;
}): Promise<InteractionReplyOptions & InteractionUpdateOptions> {
	const totalQuotes = await getQuoteCount(guildId);

	if (totalQuotes === 0) {
		return {
			content:
				"❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
			embeds: [],
			components: [],
		};
	}

	const maxPage = Math.ceil(totalQuotes / 10);
	if (page > maxPage) page = maxPage;

	const offset = (page - 1) * 10;
	const quotes = await getQuotes(guildId, 10, offset);

	let quoteList = "";
	for (const quote of quotes) {
		let text = quote.text;
		let author = quote.author;

		if (text && text.length > 30) {
			text = `${text.substring(0, 30)}...`;
		}
		if (author && author.length > 10) {
			author = `${author.substring(0, 10)}...`;
		}

		quoteList += `**${quote.quoteId}**. "${
			cleanString(text) || "An error occurred"
		}"`;

		if (author && author.length > 0) {
			quoteList += ` - ${cleanString(author)}`;
		}

		quoteList += "\n";
	}

	return {
		embeds: [
			new EmbedBuilder()
				.setTitle(`📜 Server Quotes • Page #${page} of ${maxPage}`)
				.setColor(Colors.Blue)
				.setDescription(`Use \`/quote\` to view a specific quote.

${quoteList}`),
		],
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`listquotes_u${userId}p${page - 1}`)
					.setLabel("⬅️ Prev")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === 1),
				new ButtonBuilder()
					.setCustomId(`listquotes_u${userId}p${page + 1}`)
					.setLabel("Next ➡️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === maxPage),
			),
		],
	};
}

const ListQuotesCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("list-quotes")
		.setDescription("See all quotes in this server's quote book")
		.addIntegerOption((o) =>
			o.setName("page").setDescription("The page of the quote book to view"),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 3,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.guild) {
			await interaction.reply({
				content: "❌ **|** This command can only be used in a server.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const totalQuotes = await getQuoteCount(interaction.guild.id);

		if (totalQuotes === 0) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const page = interaction.options.getInteger("page") || 1;
		const maxPage = Math.ceil(totalQuotes / 10);
		if (page > maxPage) {
			await interaction.reply({
				content: `❌ **|** That page is too high! The maximum page is **${maxPage}**.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const quoteList = await renderQuoteList({
			page,
			guildId: interaction.guild.id,
			userId: interaction.user.id,
		});

		await interaction.reply(quoteList);
	},
};

export default ListQuotesCommand;
