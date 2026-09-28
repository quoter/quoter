import { sql } from "drizzle-orm";
import {
	check,
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
} from "drizzle-orm/sqlite-core";

export const guilds = sqliteTable(
	"guilds",
	{
		guildId: text("guild_id").primaryKey(),
		nextQuoteNumber: integer("next_quote_number").notNull().default(1),
		maxQuotes: integer("max_quotes"),
		lastSeenAt: integer("last_seen_at").notNull(),
		leftAt: integer("left_at"),
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("guilds_last_seen").on(table.lastSeenAt),
		check(
			"guilds_next_quote_number_positive",
			sql`${table.nextQuoteNumber} >= 1`,
		),
		check(
			"guilds_max_quotes_nonnegative",
			sql`${table.maxQuotes} IS NULL OR ${table.maxQuotes} >= 0`,
		),
		check("guilds_last_seen_nonnegative", sql`${table.lastSeenAt} >= 0`),
		check(
			"guilds_left_at_nonnegative",
			sql`${table.leftAt} IS NULL OR ${table.leftAt} >= 0`,
		),
		check("guilds_created_at_nonnegative", sql`${table.createdAt} >= 0`),
	],
);

export const quotes = sqliteTable(
	"quotes",
	{
		guildId: text("guild_id")
			.notNull()
			.references(() => guilds.guildId, { onDelete: "cascade" }),
		quoteNumber: integer("quote_number").notNull(),
		text: text("text").notNull(),
		author: text("author"),
		quoterId: text("quoter_id"),
		editorId: text("editor_id"),
		originalMessageId: text("original_message_id"),
		originalChannelId: text("original_channel_id"),
		createdAt: integer("created_at").notNull(),
		editedAt: integer("edited_at"),
	},
	(table) => [
		primaryKey({ columns: [table.guildId, table.quoteNumber] }),
		index("quotes_guild_author").on(
			table.guildId,
			sql`${table.author} COLLATE NOCASE`,
		),
		check("quotes_number_positive", sql`${table.quoteNumber} >= 1`),
		check("quotes_text_present", sql`length(${table.text}) > 0`),
		check("quotes_created_at_nonnegative", sql`${table.createdAt} >= 0`),
		check(
			"quotes_edited_at_nonnegative",
			sql`${table.editedAt} IS NULL OR ${table.editedAt} >= 0`,
		),
	],
);

export type Quote = typeof quotes.$inferSelect;
export type GuildSettings = typeof guilds.$inferSelect;
export type NewQuote = Omit<
	typeof quotes.$inferInsert,
	"guildId" | "quoteNumber" | "createdAt"
> & { createdAt?: number };
