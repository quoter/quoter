let maxGuildQuotes = 100;
if (
	process.env.MAX_GUILD_QUOTES !== undefined &&
	process.env.MAX_GUILD_QUOTES !== ""
) {
	maxGuildQuotes = parseInt(process.env.MAX_GUILD_QUOTES, 10);
	if (Number.isNaN(maxGuildQuotes) || maxGuildQuotes < 0) {
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
	maxQuoteLength = parseInt(process.env.MAX_QUOTE_LENGTH, 10);
	if (Number.isNaN(maxQuoteLength) || maxQuoteLength < 0) {
		console.error(
			"MAX_QUOTE_LENGTH environment variable should be a positive integer or empty.",
		);
	}
}

export { maxGuildQuotes, maxQuoteLength };
