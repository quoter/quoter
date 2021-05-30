const { Schema, model } = require("mongoose");

const guildSchema = new Schema({
	_id: {
		type: String,
		required: true,
	},
	prefix: String,
	allQuote: Boolean,
	maxGuildQuotes: Number,
	maxQuoteLength: Number,
	quotes: [
		{
			text: {
				type: String,
				required: true,
			},
			author: String,
			quoterID: String,
			editorID: String,
			ogMessageID: String,
			ogChannelID: String,
			createdTimestamp: {
				type: Number,
				min: 0,
				default: Date.now(),
			},
			editedTimestamp: {
				type: Number,
				min: 0,
			},
		},
	],
});

module.exports = model("Guild", guildSchema);
