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

let maxGuildQuotes = 100;
if (
	process.env.MAX_GUILD_QUOTES !== undefined &&
	process.env.MAX_GUILD_QUOTES !== ""
) {
	maxGuildQuotes = parseInt(process.env.MAX_GUILD_QUOTES);
	if (isNaN(maxGuildQuotes) || maxGuildQuotes < 0) {
		console.error(
			"MAX_GUILD_QUOTES environment variable should be a positive integer or empty.",
		);
	}
}

let maxQuoteLength = 250;
if (
	process.env.MAX_QUOTE_LENGTH !== undefined &&
	process.env.MAX_QUOTE_LENGTH !== ""
) {
	maxQuoteLength = parseInt(process.env.MAX_QUOTE_LENGTH);
	if (isNaN(maxQuoteLength) || maxQuoteLength < 0) {
		console.error(
			"MAX_QUOTE_LENGTH environment variable should be a positive integer or empty.",
		);
	}
}

export { maxGuildQuotes, maxQuoteLength };
