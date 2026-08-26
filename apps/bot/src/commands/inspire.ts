import path from "node:path";
import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import drawMultilineText from "canvas-multiline-text";
import {
	type ChatInputCommandInteraction,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import { inspireImages } from "@/assets/inspire-images";
import type { QuoterCommand } from "@/commands";
import { getStore } from "@/db";
import type { Quote } from "@/domain/quote";
import { getGuildId } from "@/lib/guild";

const assetsDirectory = Bun.isStandaloneExecutable
	? path.resolve(import.meta.dir, "src/assets")
	: path.resolve(import.meta.dir, "../assets");

GlobalFonts.registerFromPath(
	path.resolve(assetsDirectory, "ScheherazadeNew-Regular.ttf"),
	"Regular",
);

const InspireCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("inspire")
		.setDescription("Generate an inspirational image from a quote")
		.addIntegerOption((o) =>
			o.setName("id").setDescription("The ID of the quote to use"),
		)
		.addStringOption((o) =>
			o
				.setName("author")
				.setDescription(
					"The author to randomly select a quote from (case-insensitive)",
				),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 4,
	async execute(interaction: ChatInputCommandInteraction) {
		await interaction.deferReply();

		const choice = interaction.options.getInteger("id");
		const author = interaction.options.getString("author");

		if (choice && author) {
			await interaction.editReply({
				content: "❌ **|** You can't specify both an ID and an author.",
			});
			return;
		}

		const guildId = getGuildId(interaction);
		const quote: Quote | null = choice
			? getStore().getQuote(guildId, choice)
			: getStore().getRandomQuote(guildId, author);

		if (!quote) {
			await interaction.editReply({
				content:
					"❌ **|** This server doesn't have any quotes stored, or none by that author. Use `/create-quote` to create one!",
			});
			return;
		}

		const index = Math.floor(Math.random() * inspireImages.length);

		const background = await loadImage(
			path.resolve(assetsDirectory, `${index}.jpg`),
		);
		const imageData = inspireImages[index];

		const canvas = createCanvas(background.width, background.height);
		const ctx = canvas.getContext("2d");
		ctx.drawImage(background, 0, 0);

		ctx.textBaseline = "middle";
		ctx.textAlign = imageData.multiline.textAlign;

		// Drawing the quote using the dat
		drawMultilineText(canvas.getContext("2d"), `"${quote.text}"`, {
			rect: {
				x: canvas.width * imageData.multiline.rect.xFactor,
				y: imageData.multiline.rect.y,
				width: canvas.width - imageData.multiline.rect.widthPadding * 2,
				height: imageData.multiline.rect.height,
			},
			font: imageData.multiline.font,
			minFontSize: imageData.multiline.minFontSize,
			maxFontSize: imageData.multiline.maxFontSize,
		});

		if (quote.author) {
			ctx.textAlign = imageData.author.textAlign;
			ctx.font = imageData.author.font;
			ctx.fillStyle = imageData.author.color;
			ctx.fillText(
				`- ${quote.author}`,
				canvas.width - imageData.author.widthPadding * 2,
				canvas.height - imageData.author.heightPadding * 2,
				canvas.width - 200,
			);
		}

		const jpeg = await canvas.encode("jpeg");

		await interaction.editReply({
			files: [jpeg],
		});
	},
};

export default InspireCommand;
