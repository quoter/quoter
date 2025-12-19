import { type Document, model, Schema, Types } from "mongoose";

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

export { Guild, Quote, type QuoterGuild, type QuoterQuote };
