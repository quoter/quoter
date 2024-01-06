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

interface QuoteImage {
	multiline: {
		rect: {
			xFactor: number;
			y: number;
			widthPadding: number;
			height: number;
		};
		font: string;
		textAlign: CanvasTextAlign;
		minFontSize: number;
		maxFontSize: number;
	};
	author: {
		textAlign: CanvasTextAlign;
		font: string;
		color: string;
		widthPadding: number;
		heightPadding: number;
	};
}

const quoteImages: QuoteImage[] = [
	{
		multiline: {
			rect: {
				xFactor: 0.5,
				y: 40,
				widthPadding: 250,
				height: 1000,
			},
			font: "regular",
			textAlign: "center",
			minFontSize: 170,
			maxFontSize: 250,
		},
		author: {
			textAlign: "right",
			font: '200px "regular"',
			color: "#ffffff",
			widthPadding: 60,
			heightPadding: 80,
		},
	},
	{
		multiline: {
			rect: {
				xFactor: 0.06,
				y: 30,
				widthPadding: 250,
				height: 680,
			},
			font: "regular",
			textAlign: "left",
			minFontSize: 150,
			maxFontSize: 240,
		},
		author: {
			textAlign: "right",
			font: '200px "regular"',
			color: "#ffffff",
			widthPadding: 100,
			heightPadding: 100,
		},
	},
	{
		multiline: {
			rect: {
				xFactor: 0.5,
				y: 40,
				widthPadding: 250,
				height: 1000,
			},
			font: "regular",
			textAlign: "center",
			minFontSize: 150,
			maxFontSize: 190,
		},
		author: {
			textAlign: "right",
			font: '150px "regular"',
			color: "#ffffff",
			widthPadding: 60,
			heightPadding: 80,
		},
	},
	{
		multiline: {
			rect: {
				xFactor: 0.5,
				y: 40,
				widthPadding: 210,
				height: 1000,
			},
			font: "regular",
			textAlign: "center",
			minFontSize: 150,
			maxFontSize: 190,
		},
		author: {
			textAlign: "right",
			font: '150px "regular"',
			color: "#ffffff",
			widthPadding: 60,
			heightPadding: 80,
		},
	},
	{
		multiline: {
			rect: {
				xFactor: 0.98,
				y: 40,
				widthPadding: 400,
				height: 1000,
			},
			font: "regular",
			textAlign: "right",
			minFontSize: 190,
			maxFontSize: 260,
		},
		author: {
			textAlign: "right",
			font: '250px "regular"',
			color: "#ffffff",
			widthPadding: 60,
			heightPadding: 80,
		},
	},
];

export default quoteImages;
