import { and, asc, count, eq, lt, sql } from "drizzle-orm";
import { getDatabase, getSqlite } from "@/db/database";
import {
	type GuildSettings,
	guilds,
	type NewQuote,
	type Quote,
	quotes,
} from "@/db/schema";

export interface QuoteUpdate {
	text: string;
	author?: string | null;
	editorId: string;
	editedAt?: number;
}

export interface QuotePage {
	quotes: Quote[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
}

export interface LegacyGuild {
	guildId: string;
	maxQuotes: number | null;
	maxQuoteLength: number | null;
	quotes: NewQuote[];
}

export class GuildQuoteLimitError extends Error {
	constructor(readonly limit: number) {
		super(`Guild quote limit of ${limit} reached`);
		this.name = "GuildQuoteLimitError";
	}
}

export function getSchemaVersion(): number {
	return (
		getSqlite()
			.query<{ count: number }, []>(
				"SELECT COUNT(*) AS count FROM __drizzle_migrations",
			)
			.get()?.count ?? 0
	);
}

export function checkIntegrity(): boolean {
	return (
		getSqlite()
			.query<{ integrity_check: string }, []>("PRAGMA integrity_check")
			.get()?.integrity_check === "ok"
	);
}

export function ensureGuild(guildId: string, now: number = Date.now()): void {
	getDatabase()
		.insert(guilds)
		.values({ guildId, lastSeenAt: now, createdAt: now })
		.onConflictDoUpdate({
			target: guilds.guildId,
			set: { lastSeenAt: now, leftAt: null },
		})
		.run();
}

export function touchGuilds(
	guildIds: string[],
	now: number = Date.now(),
): void {
	getDatabase().transaction(() => {
		for (const guildId of guildIds) ensureGuild(guildId, now);
	});
}

export function markGuildLeft(guildId: string, now: number = Date.now()): void {
	getDatabase()
		.update(guilds)
		.set({ leftAt: now })
		.where(eq(guilds.guildId, guildId))
		.run();
}

export function deleteGuildsNotSeenSince(cutoff: number): number {
	return getDatabase().transaction(() => {
		const db = getDatabase();
		const result = db
			.select({ count: count() })
			.from(guilds)
			.where(lt(guilds.lastSeenAt, cutoff))
			.get();
		db.delete(guilds).where(lt(guilds.lastSeenAt, cutoff)).run();
		return result?.count ?? 0;
	});
}

export function getGuildSettings(guildId: string): GuildSettings | null {
	return (
		getDatabase()
			.select()
			.from(guilds)
			.where(eq(guilds.guildId, guildId))
			.get() ?? null
	);
}

export function setGuildLimits(
	guildId: string,
	limits: { maxQuotes?: number | null; maxQuoteLength?: number | null },
): void {
	ensureGuild(guildId);
	getDatabase()
		.update(guilds)
		.set(limits)
		.where(eq(guilds.guildId, guildId))
		.run();
}

export function createQuote(
	guildId: string,
	quote: NewQuote,
	defaultMaxQuotes: number,
): Quote {
	return getDatabase().transaction(() => {
		ensureGuild(guildId);
		assertQuoteCapacity(guildId, 1, defaultMaxQuotes);
		const created = getDatabase()
			.insert(quotes)
			.values(toInsert(guildId, allocateQuoteNumber(guildId), quote))
			.returning()
			.get();
		if (!created) throw new Error("Created quote was not returned");
		return created;
	});
}

export function importQuotes(
	guildId: string,
	newQuotes: NewQuote[],
	defaultMaxQuotes: number,
): Quote[] {
	return getDatabase().transaction(() => {
		ensureGuild(guildId);
		assertQuoteCapacity(guildId, newQuotes.length, defaultMaxQuotes);
		return newQuotes.map((quote) => {
			const created = getDatabase()
				.insert(quotes)
				.values(toInsert(guildId, allocateQuoteNumber(guildId), quote))
				.returning()
				.get();
			if (!created) throw new Error("Imported quote was not returned");
			return created;
		});
	});
}

export function getQuote(guildId: string, quoteNumber: number): Quote | null {
	return (
		getDatabase()
			.select()
			.from(quotes)
			.where(
				and(eq(quotes.guildId, guildId), eq(quotes.quoteNumber, quoteNumber)),
			)
			.get() ?? null
	);
}

export function getRandomQuote(
	guildId: string,
	author?: string | null,
): Quote | null {
	const condition = author
		? and(
				eq(quotes.guildId, guildId),
				sql`${quotes.author} = ${author} COLLATE NOCASE`,
			)
		: eq(quotes.guildId, guildId);
	return (
		getDatabase()
			.select()
			.from(quotes)
			.where(condition)
			.orderBy(sql`random()`)
			.limit(1)
			.get() ?? null
	);
}

export function listQuotes(
	guildId: string,
	page: number,
	pageSize: number = 10,
): QuotePage {
	const total = countGuildQuotes(guildId);
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const safePage = Math.min(Math.max(1, page), totalPages);
	const rows = getDatabase()
		.select()
		.from(quotes)
		.where(eq(quotes.guildId, guildId))
		.orderBy(asc(quotes.quoteNumber))
		.limit(pageSize)
		.offset((safePage - 1) * pageSize)
		.all();
	return { quotes: rows, total, page: safePage, pageSize, totalPages };
}

export function getSearchCandidates(
	guildId: string,
): Pick<Quote, "quoteNumber" | "text" | "author">[] {
	return getDatabase()
		.select({
			quoteNumber: quotes.quoteNumber,
			text: quotes.text,
			author: quotes.author,
		})
		.from(quotes)
		.where(eq(quotes.guildId, guildId))
		.orderBy(asc(quotes.quoteNumber))
		.all();
}

export function updateQuote(
	guildId: string,
	quoteNumber: number,
	update: QuoteUpdate,
): Quote | null {
	const existing = getQuote(guildId, quoteNumber);
	if (!existing) return null;
	return (
		getDatabase()
			.update(quotes)
			.set({
				text: update.text,
				author: update.author === undefined ? existing.author : update.author,
				editorId: update.editorId,
				editedAt: update.editedAt ?? Date.now(),
			})
			.where(
				and(eq(quotes.guildId, guildId), eq(quotes.quoteNumber, quoteNumber)),
			)
			.returning()
			.get() ?? null
	);
}

export function deleteQuote(guildId: string, quoteNumber: number): boolean {
	return Boolean(
		getDatabase()
			.delete(quotes)
			.where(
				and(eq(quotes.guildId, guildId), eq(quotes.quoteNumber, quoteNumber)),
			)
			.returning({ quoteNumber: quotes.quoteNumber })
			.get(),
	);
}

export function countGuildQuotes(guildId: string): number {
	return (
		getDatabase()
			.select({ count: count() })
			.from(quotes)
			.where(eq(quotes.guildId, guildId))
			.get()?.count ?? 0
	);
}

export function countAllQuotes(): number {
	return (
		getDatabase().select({ count: count() }).from(quotes).get()?.count ?? 0
	);
}

export function exportQuotes(guildId: string): Quote[] {
	return getDatabase()
		.select()
		.from(quotes)
		.where(eq(quotes.guildId, guildId))
		.orderBy(asc(quotes.quoteNumber))
		.all();
}

export function migrateLegacyGuild(
	guild: LegacyGuild,
	now: number = Date.now(),
): void {
	getDatabase().transaction(() => {
		getDatabase()
			.insert(guilds)
			.values({
				guildId: guild.guildId,
				nextQuoteNumber: guild.quotes.length + 1,
				maxQuotes: guild.maxQuotes,
				maxQuoteLength: guild.maxQuoteLength,
				lastSeenAt: now,
				createdAt: now,
			})
			.run();
		if (guild.quotes.length > 0) {
			getDatabase()
				.insert(quotes)
				.values(
					guild.quotes.map((quote, index) =>
						toInsert(guild.guildId, index + 1, quote),
					),
				)
				.run();
		}
	});
}

function allocateQuoteNumber(guildId: string): number {
	const allocation = getDatabase()
		.update(guilds)
		.set({ nextQuoteNumber: sql`${guilds.nextQuoteNumber} + 1` })
		.where(eq(guilds.guildId, guildId))
		.returning({ quoteNumber: sql<number>`${guilds.nextQuoteNumber} - 1` })
		.get();
	if (!allocation) throw new Error("Quote number allocation failed");
	return allocation.quoteNumber;
}

function assertQuoteCapacity(
	guildId: string,
	newQuoteCount: number,
	defaultMaxQuotes: number,
): void {
	const settings = getGuildSettings(guildId);
	if (!settings) throw new Error("Guild was not created");
	const limit = settings.maxQuotes ?? defaultMaxQuotes;
	if (countGuildQuotes(guildId) + newQuoteCount > limit) {
		throw new GuildQuoteLimitError(limit);
	}
}

function toInsert(
	guildId: string,
	quoteNumber: number,
	quote: NewQuote,
): typeof quotes.$inferInsert {
	return {
		guildId,
		quoteNumber,
		text: quote.text,
		author: quote.author ?? null,
		quoterId: quote.quoterId ?? null,
		editorId: quote.editorId ?? null,
		originalMessageId: quote.originalMessageId ?? null,
		originalChannelId: quote.originalChannelId ?? null,
		createdAt: quote.createdAt ?? Date.now(),
		editedAt: quote.editedAt ?? null,
	};
}
