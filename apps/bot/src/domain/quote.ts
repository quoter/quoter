export interface Quote {
	guildId: string;
	quoteNumber: number;
	text: string;
	author: string | null;
	quoterId: string | null;
	editorId: string | null;
	originalMessageId: string | null;
	originalChannelId: string | null;
	createdAt: number;
	editedAt: number | null;
}

export interface NewQuote {
	text: string;
	author?: string | null;
	quoterId?: string | null;
	originalMessageId?: string | null;
	originalChannelId?: string | null;
	createdAt?: number;
	editedAt?: number | null;
}

export interface QuoteUpdate {
	text: string;
	author?: string | null;
	editorId: string;
	editedAt?: number;
}

export interface GuildSettings {
	guildId: string;
	maxQuotes: number | null;
	maxQuoteLength: number | null;
	nextQuoteNumber: number;
	lastSeenAt: number;
	leftAt: number | null;
}

export interface QuotePage {
	quotes: Quote[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}
