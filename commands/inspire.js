/*
Copyright (C) 2020-2021 Nicholas Christopher

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

const { SlashCommandBuilder } = require("@discordjs/builders");
const { registerFont, createCanvas, loadImage } = require("canvas");
const drawMultilineText = require("canvas-multiline-text");
const path = require("path");
const Guild = require("../schemas/guild.js");
const { quoteImages } = require("../assets/quoteImages.json");

registerFont(path.resolve(__dirname, "../assets/ScheherazadeNew-Regular.ttf"), {
	family: "Regular",
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName("inspire")
		.setDescription("Creates an inspirational image from a quote")
		.addIntegerOption((o) =>
			o.setName("id").setDescription("The ID of the quote to use.")
		),
	cooldown: 4,
	guildOnly: true,
	async execute(interaction) {
		await interaction.deferReply();
		const { quotes } =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		if (!quotes.length) {
			return await interaction.editReply({
				content:
					"❌ **|** This server doesn't have any quotes, use `/newquote` to add some!",
				ephemeral: true,
			});
		}

		let id = interaction.options.getInteger("id");
		id ??= Math.ceil(Math.random() * quotes.length);

		const quote = quotes[id - 1];
		if (!quote) {
			return await interaction.editReply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
		}

		const index = Math.floor(Math.random() * quoteImages.length);

		const background = await loadImage(
			`${__dirname}/../assets/${index}.jpg`
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
				canvas.width - 200
			);
		}

		await interaction.editReply({
			files: [canvas.toBuffer("image/jpeg", { quality: 0.5 })],
		});
	},
};
