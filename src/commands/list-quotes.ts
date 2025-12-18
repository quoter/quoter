import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonComponent,
	type ButtonInteraction,
	ButtonStyle,
	type ChatInputCommandInteraction,
	Colors,
	ComponentType,
	EmbedBuilder,
	InteractionContextType,
	type InteractionReplyOptions,
	type InteractionUpdateOptions,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "../QuoterCommand";
import type { QuoterQuote } from "../schemas/guild";
import cleanString from "../util/cleanString";
import fetchDbGuild from "../util/fetchDbGuild";

function render(
	page: number,
	maxPage: number,
	quotes: QuoterQuote[],
): InteractionReplyOptions & InteractionUpdateOptions {
	const start = (page - 1) * 10;
	const end = start + 10;
	const slicedQuotes = quotes.slice(start, end);

	let quoteList = "";
	let quoteNumber = 1;
	slicedQuotes.forEach((quote) => {
		if (quote.text && quote.text.length > 30) {
			quote.text = `${quote.text.substring(0, 30)}...`;
		}
		if (quote.author && quote.author.length > 10) {
			quote.author = `${quote.author.substring(0, 10)}...`;
		}

		quoteList += `**${quoteNumber + (page - 1) * 10}**. "${
			cleanString(quote.text) || "An error occurred"
		}"`;
		quoteNumber++;

		if (quote.author && quote.author.length > 0) {
			quoteList += ` - ${cleanString(quote.author)}`;
		}

		quoteList += "\n";
	});

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
					.setCustomId("prev")
					.setLabel("⬅️ Prev")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === 1),
				new ButtonBuilder()
					.setCustomId("next")
					.setLabel("Next ➡️")
					.setStyle(ButtonStyle.Primary)
					.setDisabled(page === maxPage),
			),
		],
		fetchReply: true,
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
		const { quotes } = await fetchDbGuild(interaction);

		if (!quotes.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
				ephemeral: true,
			});
			return;
		}

		let page = interaction.options.getInteger("page") || 1;
		const maxPage = Math.ceil(quotes.length / 10);
		if (page > maxPage) {
			await interaction.reply({
				content: `❌ **|** That page is too high! The maximum page is **${maxPage}**.`,
				ephemeral: true,
			});
			return;
		}

		const reply = await interaction.reply(render(page, maxPage, quotes));

		function filter(press: ButtonInteraction) {
			if (press.user.id === interaction.user.id) {
				return true;
			} else {
				press.reply({
					content:
						"❌ **|** You clicked on someone else's button. Get your own with `/list-quotes`!",
					ephemeral: true,
				});
				return false;
			}
		}

		const awaitPress = async () => {
			try {
				const press = await reply.awaitMessageComponent({
					filter,
					componentType: ComponentType.Button,
					time: 35000,
				});

				const id = (press.component as ButtonComponent).customId;
				if (id === "prev") {
					await press.update(render(--page, maxPage, quotes));
					await awaitPress();
				} else {
					await press.update(render(++page, maxPage, quotes));
					await awaitPress();
				}
			} catch {
				await reply.edit({ components: [] });
			}
		};
		await awaitPress();
	},
};

export default ListQuotesCommand;
