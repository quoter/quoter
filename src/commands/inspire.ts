/*
Copyright (C) 2020-2024 Nick Oates

This file is part of Quoter.

Quoter is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.

Quoter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Quoter.  If not, see <https://www.gnu.org/licenses/>.
*/

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { GlobalFonts, createCanvas, loadImage } from "@napi-rs/canvas";
import drawMultilineText from "canvas-multiline-text";
import quoteImages from "../assets/quoteImages";
import { QuoterCommand } from "../QuoterCommand";
import fetchDbGuild from "../util/fetchDbGuild";
import { QuoterQuote } from "../schemas/guild";
import path from "path";

GlobalFonts.registerFromPath(
	path.resolve(__dirname, "../../assets/ScheherazadeNew-Regular.ttf"),
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
		.setDMPermission(false),
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

		const guild = await fetchDbGuild(interaction);
		let quotes: QuoterQuote[] = guild.quotes;

		if (author) {
			quotes = quotes.filter(
				(q) =>
					q.author && q.author.toLowerCase() === author.toLowerCase(),
			);
		}

		if (!quotes.length) {
			await interaction.editReply({
				content:
					"❌ **|** This server doesn't have any quotes stored, or none by that author. Use `/create-quote` to create one!",
			});
			return;
		}

		const id = choice ?? Math.ceil(Math.random() * quotes.length);

		const quote = quotes[id - 1];
		if (!quote) {
			await interaction.editReply({
				content: "❌ **|** I couldn't find a quote with that ID.",
			});
			return;
		}

		const index = Math.floor(Math.random() * quoteImages.length);

		const background = await loadImage(
			`${import.meta.dir}/../assets/${index}.jpg`,
		);
		const imageData = quoteImages[index];

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
