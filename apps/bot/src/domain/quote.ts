import type { guilds, quotes } from "@/db/schema";

export type Quote = typeof quotes.$inferSelect;

export interface NewQuote {
	text: string;
	author?: string | null;
	quoterId?: string | null;
	editorId?: string | null;
	originalMessageId?: string | null;
	originalChannelId?: string | null;
	createdAt?: number;
	editedAt?: number | null;
}

export interface LegacyGuild {
	guildId: string;
	maxQuotes: number | null;
	maxQuoteLength: number | null;
	quotes: NewQuote[];
}

export interface QuoteUpdate {
	text: string;
	author?: string | null;
	editorId: string;
	editedAt?: number;
}

export type GuildSettings = typeof guilds.$inferSelect;

export interface QuotePage {
	quotes: Quote[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
