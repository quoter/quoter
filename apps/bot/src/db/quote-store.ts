import { Database } from "bun:sqlite";
import { and, asc, count, eq, lt, sql } from "drizzle-orm";
import { type BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { guilds, quotes } from "@/db/schema";
import type {
	GuildSettings,
	LegacyGuild,
	NewQuote,
	Quote,
	QuotePage,
	QuoteUpdate,
} from "@/domain/quote";

export class GuildQuoteLimitError extends Error {
	constructor(readonly limit: number) {
		super(`Guild quote limit of ${limit} reached`);
		this.name = "GuildQuoteLimitError";
	}
}

type QuoterDatabase = BunSQLiteDatabase<{
	guilds: typeof guilds;
	quotes: typeof quotes;
}>;

const migrationsFolder = `${import.meta.dir}/../../drizzle`;

export class QuoteStore {
	readonly database: Database;
	readonly db: QuoterDatabase;

	constructor(path: string = ":memory:") {
		this.database = new Database(path, { create: true, strict: true });
		this.database.exec("PRAGMA foreign_keys = ON");
		this.database.exec("PRAGMA busy_timeout = 5000");
		if (path !== ":memory:") this.database.exec("PRAGMA journal_mode = WAL");
		this.db = drizzle({ client: this.database, schema: { guilds, quotes } });
		migrate(this.db, { migrationsFolder });
	}

	close(): void {
		this.database.close();
	}

	getSchemaVersion(): number {
		const result = this.database
			.query<{ count: number }, []>(
				"SELECT COUNT(*) AS count FROM __drizzle_migrations",
			)
			.get();
		return result?.count ?? 0;
	}

	ensureGuild(guildId: string, now: number = Date.now()): void {
		this.db
			.insert(guilds)
			.values({ guildId, lastSeenAt: now, createdAt: now })
			.onConflictDoUpdate({
				target: guilds.guildId,
				set: { lastSeenAt: now, leftAt: null },
			})
			.run();
	}

	touchGuilds(guildIds: string[], now: number = Date.now()): void {
		this.database.transaction(() => {
			for (const guildId of guildIds) this.ensureGuild(guildId, now);
		})();
	}

	markGuildLeft(guildId: string, now: number = Date.now()): void {
		this.db
			.update(guilds)
			.set({ leftAt: now })
			.where(eq(guilds.guildId, guildId))
			.run();
	}

	deleteGuildsNotSeenSince(cutoff: number): number {
		return this.database.transaction(() => {
			const [result] = this.db
				.select({ count: count() })
				.from(guilds)
				.where(lt(guilds.lastSeenAt, cutoff))
				.all();
			this.db.delete(guilds).where(lt(guilds.lastSeenAt, cutoff)).run();
			return result?.count ?? 0;
		})();
	}

	getGuildSettings(guildId: string): GuildSettings | null {
		return (
			this.db.select().from(guilds).where(eq(guilds.guildId, guildId)).get() ??
			null
		);
	}

	setGuildLimits(
		guildId: string,
		limits: { maxQuotes?: number | null; maxQuoteLength?: number | null },
	): void {
		this.ensureGuild(guildId);
		this.db.update(guilds).set(limits).where(eq(guilds.guildId, guildId)).run();
	}

	createQuote(
		guildId: string,
		quote: NewQuote,
		defaultMaxQuotes: number,
	): Quote {
		return this.database.transaction(() => {
			this.ensureGuild(guildId);
			this.assertQuoteCapacity(guildId, 1, defaultMaxQuotes);
			const quoteNumber = this.allocateQuoteNumber(guildId);
			const [created] = this.db
				.insert(quotes)
				.values(this.toInsert(guildId, quoteNumber, quote))
				.returning()
				.all();
			if (!created) throw new Error("Created quote was not returned");
			return created;
		})();
	}

	importQuotes(
		guildId: string,
		newQuotes: NewQuote[],
		defaultMaxQuotes: number,
	): Quote[] {
		return this.database.transaction(() => {
			this.ensureGuild(guildId);
			this.assertQuoteCapacity(guildId, newQuotes.length, defaultMaxQuotes);
			const imported: Quote[] = [];
			for (const quote of newQuotes) {
				const quoteNumber = this.allocateQuoteNumber(guildId);
				const [created] = this.db
					.insert(quotes)
					.values(this.toInsert(guildId, quoteNumber, quote))
					.returning()
					.all();
				if (!created) throw new Error("Imported quote was not returned");
				imported.push(created);
			}
			return imported;
		})();
	}

	getQuote(guildId: string, quoteNumber: number): Quote | null {
		return (
			this.db
				.select()
				.from(quotes)
				.where(
					and(eq(quotes.guildId, guildId), eq(quotes.quoteNumber, quoteNumber)),
				)
				.get() ?? null
		);
	}

	getRandomQuote(guildId: string, author?: string | null): Quote | null {
		const condition = author
			? and(
					eq(quotes.guildId, guildId),
					sql`${quotes.author} = ${author} COLLATE NOCASE`,
				)
			: eq(quotes.guildId, guildId);
		return (
			this.db
				.select()
				.from(quotes)
				.where(condition)
				.orderBy(sql`random()`)
				.limit(1)
				.get() ?? null
		);
	}

	listQuotes(guildId: string, page: number, pageSize: number = 10): QuotePage {
		const total = this.countGuildQuotes(guildId);
		const totalPages = Math.max(1, Math.ceil(total / pageSize));
		const safePage = Math.min(Math.max(1, page), totalPages);
		const rows = this.db
			.select()
			.from(quotes)
			.where(eq(quotes.guildId, guildId))
			.orderBy(asc(quotes.quoteNumber))
			.limit(pageSize)
			.offset((safePage - 1) * pageSize)
			.all();
		return { quotes: rows, total, page: safePage, pageSize, totalPages };
	}

	getSearchCandidates(
		guildId: string,
	): Pick<Quote, "quoteNumber" | "text" | "author">[] {
		return this.db
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

	updateQuote(
		guildId: string,
		quoteNumber: number,
		update: QuoteUpdate,
	): Quote | null {
		const existing = this.getQuote(guildId, quoteNumber);
		if (!existing) return null;
		const [updated] = this.db
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
			.all();
		return updated ?? null;
	}

	deleteQuote(guildId: string, quoteNumber: number): boolean {
		return (
			this.db
				.delete(quotes)
				.where(
					and(eq(quotes.guildId, guildId), eq(quotes.quoteNumber, quoteNumber)),
				)
				.returning({ quoteNumber: quotes.quoteNumber })
				.all().length === 1
		);
	}

	countGuildQuotes(guildId: string): number {
		return (
			this.db
				.select({ count: count() })
				.from(quotes)
				.where(eq(quotes.guildId, guildId))
				.get()?.count ?? 0
		);
	}

	countAllQuotes(): number {
		return this.db.select({ count: count() }).from(quotes).get()?.count ?? 0;
	}

	exportQuotes(guildId: string): Quote[] {
		return this.db
			.select()
			.from(quotes)
			.where(eq(quotes.guildId, guildId))
			.orderBy(asc(quotes.quoteNumber))
			.all();
	}

	migrateLegacyGuild(guild: LegacyGuild, now: number = Date.now()): void {
		this.database.transaction(() => {
			this.db
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

			if (guild.quotes.length === 0) return;
			this.db
				.insert(quotes)
				.values(
					guild.quotes.map((quote, index) =>
						this.toInsert(guild.guildId, index + 1, quote),
					),
				)
				.run();
		})();
	}

	checkIntegrity(): boolean {
		return (
			this.database
				.query<{ integrity_check: string }, []>("PRAGMA integrity_check")
				.get()?.integrity_check === "ok"
		);
	}

	private allocateQuoteNumber(guildId: string): number {
		const [allocation] = this.db
			.update(guilds)
			.set({ nextQuoteNumber: sql`${guilds.nextQuoteNumber} + 1` })
			.where(eq(guilds.guildId, guildId))
			.returning({
				quoteNumber: sql<number>`${guilds.nextQuoteNumber} - 1`,
			})
			.all();
		if (!allocation) throw new Error("Quote number allocation failed");
		return allocation.quoteNumber;
	}

	private assertQuoteCapacity(
		guildId: string,
		newQuoteCount: number,
		defaultMaxQuotes: number,
	): void {
		const settings = this.getGuildSettings(guildId);
		if (!settings) throw new Error("Guild was not created");
		const limit = settings.maxQuotes ?? defaultMaxQuotes;
		if (this.countGuildQuotes(guildId) + newQuoteCount > limit) {
			throw new GuildQuoteLimitError(limit);
		}
	}

	private toInsert(
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
}
