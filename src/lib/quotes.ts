import { and, count, eq, like, or, sql } from "drizzle-orm";
import { db } from "./db";
import { guilds, type NewQuote, quotes } from "./db/schema";

/**
 * Ensure a guild exists in the database and return it
 */
export async function ensureGuild(guildId: string) {
	const existing = await db.query.guilds.findFirst({
		where: eq(guilds.id, guildId),
	});

	if (existing) {
		return existing;
	}

	// Create the guild if it doesn't exist
	await db.insert(guilds).values({ id: guildId, quoteIncr: 1 });

	return await db.query.guilds.findFirst({
		where: eq(guilds.id, guildId),
	});
}

/**
 * Get a specific quote by its quote ID (unique within guild)
 */
export async function getQuote(guildId: string, quoteId: number) {
	return await db.query.quotes.findFirst({
		where: and(eq(quotes.guildId, guildId), eq(quotes.quoteId, quoteId)),
	});
}

/**
 * Get quotes with pagination, ordered by quoteId
 */
export async function getQuotes(
	guildId: string,
	limit: number = 10,
	offset: number = 0,
) {
	return await db.query.quotes.findMany({
		where: eq(quotes.guildId, guildId),
		orderBy: [quotes.quoteId],
		limit,
		offset,
	});
}

/**
 * Get all quotes for a guild (for compatibility with old code)
 */
export async function getAllQuotes(guildId: string) {
	return await db.query.quotes.findMany({
		where: eq(quotes.guildId, guildId),
		orderBy: [quotes.quoteId],
	});
}

/**
 * Get total quote count for a guild
 */
export async function getQuoteCount(guildId: string) {
	const result = await db
		.select({ count: count() })
		.from(quotes)
		.where(eq(quotes.guildId, guildId));

	return result[0]?.count || 0;
}

/**
 * Get the next available quote ID for a guild
 */
async function getNextQuoteId(guildId: string): Promise<number> {
	// Ensure guild exists
	const guild = await ensureGuild(guildId);

	// Get current quote incrementer
	const currentIncr = guild.quoteIncr || 1;

	// Update the incrementer for next time
	await db
		.update(guilds)
		.set({ quoteIncr: currentIncr + 1 })
		.where(eq(guilds.id, guildId));

	return currentIncr;
}

/**
 * Create a new quote with auto-incremented quote ID
 */
export async function createQuote(
	guildId: string,
	quoteData: Omit<NewQuote, "guildId" | "quoteId">,
) {
	// Get the next quote ID for this guild
	const quoteId = await getNextQuoteId(guildId);

	// Insert the quote
	const result = await db
		.insert(quotes)
		.values({
			...quoteData,
			guildId,
			quoteId,
		})
		.returning();

	return result[0];
}

/**
 * Update a quote by its internal database ID
 */
export async function updateQuote(
	id: number,
	quoteData: Partial<Omit<NewQuote, "guildId" | "id" | "quoteId">>,
) {
	const result = await db
		.update(quotes)
		.set(quoteData)
		.where(eq(quotes.id, id))
		.returning();

	return result[0];
}

/**
 * Delete a quote by its internal database ID
 */
export async function deleteQuote(id: number) {
	await db.delete(quotes).where(eq(quotes.id, id));
}

/**
 * Search quotes by text or author using SQLite LIKE
 */
export async function searchQuotes(
	guildId: string,
	searchTerm: string,
	limit: number = 5,
) {
	const pattern = `%${searchTerm}%`;

	return await db.query.quotes.findMany({
		where: and(
			eq(quotes.guildId, guildId),
			or(like(quotes.text, pattern), like(quotes.author, pattern)),
		),
		orderBy: [quotes.quoteId],
		limit,
	});
}

/**
 * Get a random quote, optionally filtered by author
 * Uses SQLite's RANDOM() function for efficiency
 */
export async function getRandomQuote(guildId: string, author?: string) {
	const conditions = [eq(quotes.guildId, guildId)];

	if (author) {
		// Filter by author (case-insensitive)
		conditions.push(sql`lower(${quotes.author}) = lower(${author})`);
	}

	const result = await db.query.quotes.findFirst({
		where: conditions.length > 1 ? and(...conditions) : conditions[0],
		orderBy: sql`RANDOM()`,
	});

	return result || null;
}

/**
 * Get quotes filtered by author
 */
export async function getQuotesByAuthor(guildId: string, author: string) {
	return await db.query.quotes.findMany({
		where: and(
			eq(quotes.guildId, guildId),
			sql`lower(${quotes.author}) = lower(${author})`,
		),
		orderBy: [quotes.quoteId],
	});
}

/**
 * Get the highest quote ID currently in use for a guild
 */
export async function getMaxQuoteId(guildId: string): Promise<number> {
	const result = await db.query.quotes.findFirst({
		where: eq(quotes.guildId, guildId),
		orderBy: sql`${quotes.quoteId} DESC`,
	});

	return result?.quoteId || 0;
}

