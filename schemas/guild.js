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
			_id: {
				type: Number,
				required: true,
				default() {
					const { quotes } = this.parent();
					const last = quotes?.[quotes.length - 1];
					return last?._id + 1 || 1;
				},
			},
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
