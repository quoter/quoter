import { Database } from "bun:sqlite";
import type {
	GuildSettings,
	NewQuote,
	Quote,
	QuotePage,
	QuoteUpdate,
} from "@/domain/quote";
import { getSchemaVersion, migrateDatabase } from "@/db/migrations";

export class GuildQuoteLimitError extends Error {
	constructor(readonly limit: number) {
		super(`Guild quote limit of ${limit} reached`);
		this.name = "GuildQuoteLimitError";
	}
}

type QuoteRow = Omit<Quote, "author"> & { author: string | null };

const quoteColumns = `
	guild_id AS guildId,
	quote_number AS quoteNumber,
	text,
	author,
	quoter_id AS quoterId,
	editor_id AS editorId,
	original_message_id AS originalMessageId,
	original_channel_id AS originalChannelId,
	created_at AS createdAt,
	edited_at AS editedAt
`;

export class QuoteStore {
	readonly database: Database;

	constructor(path: string = ":memory:") {
		this.database = new Database(path, { create: true, strict: true });
		this.database.exec("PRAGMA foreign_keys = ON");
		this.database.exec("PRAGMA busy_timeout = 5000");
		if (path !== ":memory:") {
			this.database.exec("PRAGMA journal_mode = WAL");
		}
		migrateDatabase(this.database);
	}

	close(): void {
		this.database.close();
	}

	getSchemaVersion(): number {
		return getSchemaVersion(this.database);
	}

	ensureGuild(guildId: string, now: number = Date.now()): void {
		this.database
			.query(
				`INSERT INTO guilds (guild_id, last_seen_at, created_at)
				 VALUES (?, ?, ?)
				 ON CONFLICT (guild_id) DO UPDATE SET
				   last_seen_at = excluded.last_seen_at,
				   left_at = NULL`,
			)
			.run(guildId, now, now);
	}

	touchGuilds(guildIds: string[], now: number = Date.now()): void {
		const touch = this.database.transaction((ids: string[]) => {
			for (const guildId of ids) this.ensureGuild(guildId, now);
		});
		touch(guildIds);
	}

	markGuildLeft(guildId: string, now: number = Date.now()): void {
		this.database
			.query("UPDATE guilds SET left_at = ? WHERE guild_id = ?")
			.run(now, guildId);
	}

	deleteGuildsNotSeenSince(cutoff: number): number {
		const remove = this.database.transaction(() => {
			const count =
				this.database
					.query<{ count: number }, [number]>(
						"SELECT COUNT(*) AS count FROM guilds WHERE last_seen_at < ?",
					)
					.get(cutoff)?.count ?? 0;
			this.database
				.query("DELETE FROM guilds WHERE last_seen_at < ?")
				.run(cutoff);
			return count;
		});
		return remove();
	}

	getGuildSettings(guildId: string): GuildSettings | null {
		return this.database
			.query<GuildSettings, [string]>(
				`SELECT
					guild_id AS guildId,
					next_quote_number AS nextQuoteNumber,
					max_quotes AS maxQuotes,
					max_quote_length AS maxQuoteLength,
					last_seen_at AS lastSeenAt,
					left_at AS leftAt
				 FROM guilds WHERE guild_id = ?`,
			)
			.get(guildId);
	}

	setGuildLimits(
		guildId: string,
		limits: { maxQuotes?: number | null; maxQuoteLength?: number | null },
	): void {
		this.ensureGuild(guildId);
		if (limits.maxQuotes !== undefined) {
			this.database
				.query("UPDATE guilds SET max_quotes = ? WHERE guild_id = ?")
				.run(limits.maxQuotes, guildId);
		}
		if (limits.maxQuoteLength !== undefined) {
			this.database
				.query("UPDATE guilds SET max_quote_length = ? WHERE guild_id = ?")
				.run(limits.maxQuoteLength, guildId);
		}
	}

	createQuote(
		guildId: string,
		quote: NewQuote,
		defaultMaxQuotes: number,
	): Quote {
		const create = this.database.transaction(() => {
			this.ensureGuild(guildId);
			const settings = this.getGuildSettings(guildId);
			if (!settings) throw new Error("Guild was not created");

			const quoteCount = this.countGuildQuotes(guildId);
			const limit = settings.maxQuotes ?? defaultMaxQuotes;
			if (quoteCount >= limit) throw new GuildQuoteLimitError(limit);

			const allocation = this.database
				.query<{ quoteNumber: number }, [string]>(
					`UPDATE guilds
					 SET next_quote_number = next_quote_number + 1
					 WHERE guild_id = ?
					 RETURNING next_quote_number - 1 AS quoteNumber`,
				)
				.get(guildId);
			if (!allocation) throw new Error("Quote number allocation failed");

			const createdAt = quote.createdAt ?? Date.now();
			this.database
				.query(
					`INSERT INTO quotes (
						guild_id, quote_number, text, author, quoter_id,
						original_message_id, original_channel_id, created_at, edited_at
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				)
				.run(
					guildId,
					allocation.quoteNumber,
					quote.text,
					quote.author ?? null,
					quote.quoterId ?? null,
					quote.originalMessageId ?? null,
					quote.originalChannelId ?? null,
					createdAt,
					quote.editedAt ?? null,
				);

			const created = this.getQuote(guildId, allocation.quoteNumber);
			if (!created) throw new Error("Created quote was not found");
			return created;
		});

		return create();
	}

	importQuotes(
		guildId: string,
		quotes: NewQuote[],
		defaultMaxQuotes: number,
	): Quote[] {
		const runImport = this.database.transaction(() => {
			this.ensureGuild(guildId);
			const settings = this.getGuildSettings(guildId);
			if (!settings) throw new Error("Guild was not created");
			const limit = settings.maxQuotes ?? defaultMaxQuotes;
			if (this.countGuildQuotes(guildId) + quotes.length > limit) {
				throw new GuildQuoteLimitError(limit);
			}

			const imported: Quote[] = [];
			for (const quote of quotes) {
				const allocation = this.database
					.query<{ quoteNumber: number }, [string]>(
						`UPDATE guilds
						 SET next_quote_number = next_quote_number + 1
						 WHERE guild_id = ?
						 RETURNING next_quote_number - 1 AS quoteNumber`,
					)
					.get(guildId);
				if (!allocation) throw new Error("Quote number allocation failed");

				const createdAt = quote.createdAt ?? Date.now();
				this.database
					.query(
						`INSERT INTO quotes (
							guild_id, quote_number, text, author, quoter_id,
							original_message_id, original_channel_id, created_at, edited_at
						) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
					)
					.run(
						guildId,
						allocation.quoteNumber,
						quote.text,
						quote.author ?? null,
						quote.quoterId ?? null,
						quote.originalMessageId ?? null,
						quote.originalChannelId ?? null,
						createdAt,
						quote.editedAt ?? null,
					);
				const created = this.getQuote(guildId, allocation.quoteNumber);
				if (!created) throw new Error("Imported quote was not found");
				imported.push(created);
			}
			return imported;
		});

		return runImport();
	}

	getQuote(guildId: string, quoteNumber: number): Quote | null {
		return this.database
			.query<QuoteRow, [string, number]>(
				`SELECT ${quoteColumns}
				 FROM quotes WHERE guild_id = ? AND quote_number = ?`,
			)
			.get(guildId, quoteNumber);
	}

	getRandomQuote(guildId: string, author?: string | null): Quote | null {
		if (author) {
			return this.database
				.query<QuoteRow, [string, string]>(
					`SELECT ${quoteColumns}
					 FROM quotes
					 WHERE guild_id = ? AND author = ? COLLATE NOCASE
					 ORDER BY random() LIMIT 1`,
				)
				.get(guildId, author);
		}

		return this.database
			.query<QuoteRow, [string]>(
				`SELECT ${quoteColumns}
				 FROM quotes WHERE guild_id = ? ORDER BY random() LIMIT 1`,
			)
			.get(guildId);
	}

	listQuotes(guildId: string, page: number, pageSize: number = 10): QuotePage {
		const total = this.countGuildQuotes(guildId);
		const totalPages = Math.max(1, Math.ceil(total / pageSize));
		const safePage = Math.min(Math.max(1, page), totalPages);
		const quotes = this.database
			.query<QuoteRow, [string, number, number]>(
				`SELECT ${quoteColumns}
				 FROM quotes WHERE guild_id = ?
				 ORDER BY quote_number LIMIT ? OFFSET ?`,
			)
			.all(guildId, pageSize, (safePage - 1) * pageSize);
		return { quotes, total, page: safePage, pageSize, totalPages };
	}

	getSearchCandidates(
		guildId: string,
	): Pick<Quote, "quoteNumber" | "text" | "author">[] {
		return this.database
			.query<
				Pick<Quote, "quoteNumber" | "text" | "author">,
				[string]
			>(
				`SELECT quote_number AS quoteNumber, text, author
				 FROM quotes WHERE guild_id = ? ORDER BY quote_number`,
			)
			.all(guildId);
	}

	updateQuote(
		guildId: string,
		quoteNumber: number,
		update: QuoteUpdate,
	): Quote | null {
		const existing = this.getQuote(guildId, quoteNumber);
		if (!existing) return null;

		this.database
			.query(
				`UPDATE quotes SET
					text = ?, author = ?, editor_id = ?, edited_at = ?
				 WHERE guild_id = ? AND quote_number = ?`,
			)
			.run(
				update.text,
				update.author === undefined ? existing.author : update.author,
				update.editorId,
				update.editedAt ?? Date.now(),
				guildId,
				quoteNumber,
			);
		return this.getQuote(guildId, quoteNumber);
	}

	deleteQuote(guildId: string, quoteNumber: number): boolean {
		return (
			this.database
				.query("DELETE FROM quotes WHERE guild_id = ? AND quote_number = ?")
				.run(guildId, quoteNumber).changes === 1
		);
	}

	countGuildQuotes(guildId: string): number {
		return (
			this.database
				.query<{ count: number }, [string]>(
					"SELECT COUNT(*) AS count FROM quotes WHERE guild_id = ?",
				)
				.get(guildId)?.count ?? 0
		);
	}

	countAllQuotes(): number {
		return (
			this.database
				.query<{ count: number }, []>("SELECT COUNT(*) AS count FROM quotes")
				.get()?.count ?? 0
		);
	}

	exportQuotes(guildId: string): Quote[] {
		return this.database
			.query<QuoteRow, [string]>(
				`SELECT ${quoteColumns}
				 FROM quotes WHERE guild_id = ? ORDER BY quote_number`,
			)
			.all(guildId);
	}
}
