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
    createdAt: integer("created_at").notNull(),
    guildId: text("guild_id").primaryKey(),
    lastSeenAt: integer("last_seen_at").notNull(),
    leftAt: integer("left_at"),
    maxQuotes: integer("max_quotes"),
    nextQuoteNumber: integer("next_quote_number").notNull().default(1),
  },
  (table) => [
    index("guilds_last_seen").on(table.lastSeenAt),
    check(
      "guilds_next_quote_number_positive",
      sql`${table.nextQuoteNumber} >= 1`
    ),
    check(
      "guilds_max_quotes_nonnegative",
      sql`${table.maxQuotes} IS NULL OR ${table.maxQuotes} >= 0`
    ),
    check("guilds_last_seen_nonnegative", sql`${table.lastSeenAt} >= 0`),
    check(
      "guilds_left_at_nonnegative",
      sql`${table.leftAt} IS NULL OR ${table.leftAt} >= 0`
    ),
    check("guilds_created_at_nonnegative", sql`${table.createdAt} >= 0`),
  ]
);

export const quotes = sqliteTable(
  "quotes",
  {
    author: text("author"),
    createdAt: integer("created_at").notNull(),
    editedAt: integer("edited_at"),
    editorId: text("editor_id"),
    guildId: text("guild_id")
      .notNull()
      .references(() => guilds.guildId, { onDelete: "cascade" }),
    originalChannelId: text("original_channel_id"),
    originalMessageId: text("original_message_id"),
    quoteNumber: integer("quote_number").notNull(),
    quoterId: text("quoter_id"),
    text: text("text").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.guildId, table.quoteNumber] }),
    index("quotes_guild_author").on(
      table.guildId,
      sql`${table.author} COLLATE NOCASE`
    ),
    check("quotes_number_positive", sql`${table.quoteNumber} >= 1`),
    check("quotes_text_present", sql`length(${table.text}) > 0`),
    check("quotes_created_at_nonnegative", sql`${table.createdAt} >= 0`),
    check(
      "quotes_edited_at_nonnegative",
      sql`${table.editedAt} IS NULL OR ${table.editedAt} >= 0`
    ),
  ]
);

export type Quote = typeof quotes.$inferSelect;
export type GuildSettings = typeof guilds.$inferSelect;
export type NewQuote = Omit<
  typeof quotes.$inferInsert,
  "guildId" | "quoteNumber" | "createdAt"
> & { createdAt?: number };
