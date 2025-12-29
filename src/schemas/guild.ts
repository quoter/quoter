import type { InferSchemaType } from "mongoose";
import { Schema, model } from "mongoose";

const quoteSchema = new Schema({
	text: { type: String, required: true },
	author: String,
	quoterID: String,
	editorID: String,
	ogMessageID: String,
	ogChannelID: String,
	createdTimestamp: { type: Number, min: 0, default: Date.now },
	editedTimestamp: { type: Number, min: 0 },
});

const guildSchema = new Schema({
	_id: { type: String, required: true },
	maxGuildQuotes: Number,
	maxQuoteLength: Number,
	quotes: [quoteSchema],
});

type Guild = InferSchemaType<typeof guildSchema>;
type Quote = InferSchemaType<typeof quoteSchema>;
const Guild = model<Guild>("Guild", guildSchema);
const Quote = model<Quote>("Quote", quoteSchema);

export { Guild, Quote };
