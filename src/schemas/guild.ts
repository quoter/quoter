/*
Copyright (C) 2020-2023 Nick Oates

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

import { Document, Schema, model, Types } from "mongoose";

interface QuoterQuote extends Types.Subdocument {
	text: string;
	author?: string;
	quoterID?: string;
	editorID?: string;
	ogMessageID?: string;
	ogChannelID?: string;
	createdTimestamp?: number;
	editedTimestamp?: number;
}

interface QuoterGuild extends Document {
	_id: string;
	maxGuildQuotes?: number;
	maxQuoteLength?: number;
	quotes: Types.DocumentArray<QuoterQuote>;
}

const QuoteSchema = new Schema<QuoterQuote>({
	text: { type: String, required: true },
	author: String,
	quoterID: String,
	editorID: String,
	ogMessageID: String,
	ogChannelID: String,
	createdTimestamp: { type: Number, min: 0, default: Date.now },
	editedTimestamp: { type: Number, min: 0 },
});

const GuildSchema = new Schema<QuoterGuild>({
	_id: { type: String, required: true },
	maxGuildQuotes: Number,
	maxQuoteLength: Number,
	quotes: [QuoteSchema],
});

const Guild = model<QuoterGuild>("Guild", GuildSchema);
const Quote = model<QuoterQuote>("Quote", QuoteSchema);

export { Guild, Quote, QuoterGuild, QuoterQuote };
