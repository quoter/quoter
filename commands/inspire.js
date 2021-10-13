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
		const { quotes } =
			interaction.db ??
			(await Guild.findOneAndUpdate(
				{ _id: interaction.guild.id },
				{},
				{ upsert: true, new: true }
			));

		if (!quotes.length) {
			return await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes, use `/newquote` to add some!",
				ephemeral: true,
			});
		}

		let id = interaction.options.getInteger("id");
		id ??= Math.ceil(Math.random() * quotes.length);

		const quote = quotes[id - 1];
		if (!quote) {
			return await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
		}

		const background = await loadImage(
			`${__dirname}/../assets/quoteImage.jpg`
		);

		const canvas = createCanvas(background.width, background.height);
		const ctx = canvas.getContext("2d");

		ctx.drawImage(background, 0, 0);

		ctx.font = '70px "regular"';

		ctx.textBaseline = "middle";
		ctx.textAlign = "center";

		drawMultilineText(canvas.getContext("2d"), `"${quote.text}"`, {
			rect: {
				x: canvas.width / 2,
				y: 40,
				width: canvas.width - 500,
				height: 1000,
			},
			font: "regular",
			minFontSize: 170,
			maxFontSize: 250,
		});

		if (quote.author) {
			ctx.textAlign = "left";
			ctx.font = '200px "regular"';
			ctx.fillStyle = "#ffffff";
			ctx.fillText(
				`- ${quote.author}`,
				canvas.width - ctx.measureText(`- ${quote.author}`).width - 120,
				canvas.height - 160
			);
		}

		await interaction.reply({
			files: [canvas.toBuffer("image/jpeg", { quality: 0.5 })],
		});
	},
};
