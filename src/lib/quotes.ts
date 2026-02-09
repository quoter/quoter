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
	await db.insert(guilds).values({ id: guildId });

	return await db.query.guilds.findFirst({
		where: eq(guilds.id, guildId),
	});
}

/**
 * Get a specific quote by its ID (1-indexed for user-facing)
 */
export async function getQuote(guildId: string, quoteNumber: number) {
	// Get all quotes for the guild, ordered by ID
	const allQuotes = await db.query.quotes.findMany({
		where: eq(quotes.guildId, guildId),
		orderBy: [quotes.id],
	});

	// Return the quote at the 1-indexed position
	return allQuotes[quoteNumber - 1];
}

/**
 * Get quotes with pagination
 */
export async function getQuotes(
	guildId: string,
	limit: number = 10,
	offset: number = 0,
) {
	return await db.query.quotes.findMany({
		where: eq(quotes.guildId, guildId),
		orderBy: [quotes.id],
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
		orderBy: [quotes.id],
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
 * Create a new quote
 */
export async function createQuote(
	guildId: string,
	quoteData: Omit<NewQuote, "guildId">,
) {
	// Ensure guild exists
	await ensureGuild(guildId);

	// Insert the quote
	const result = await db
		.insert(quotes)
		.values({
			...quoteData,
			guildId,
		})
		.returning();

	return result[0];
}

/**
 * Update a quote
 */
export async function updateQuote(
	quoteId: number,
	quoteData: Partial<Omit<NewQuote, "guildId" | "id">>,
) {
	const result = await db
		.update(quotes)
		.set(quoteData)
		.where(eq(quotes.id, quoteId))
		.returning();

	return result[0];
}

/**
 * Delete a quote
 */
export async function deleteQuote(quoteId: number) {
	await db.delete(quotes).where(eq(quotes.id, quoteId));
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
		orderBy: [quotes.id],
		limit,
	});
}

/**
 * Get a random quote, optionally filtered by author
 */
export async function getRandomQuote(guildId: string, author?: string) {
	let allQuotes: (typeof quotes.$inferSelect)[];

	if (author) {
		// Filter by author (case-insensitive)
		allQuotes = await db.query.quotes.findMany({
			where: and(
				eq(quotes.guildId, guildId),
				sql`lower(${quotes.author}) = lower(${author})`,
			),
		});
	} else {
		allQuotes = await getAllQuotes(guildId);
	}

	if (allQuotes.length === 0) {
		return null;
	}

	const randomIndex = Math.floor(Math.random() * allQuotes.length);
	return allQuotes[randomIndex];
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
		orderBy: [quotes.id],
	});
}
