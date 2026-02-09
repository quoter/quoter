import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const guilds = sqliteTable("guilds", {
	id: text("id").primaryKey(),
	maxGuildQuotes: integer("max_guild_quotes"),
	quoteIncr: integer("quote_incr").notNull().default(1),
});

export const quotes = sqliteTable("quotes", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	guildId: text("guild_id")
		.notNull()
		.references(() => guilds.id, { onDelete: "cascade" }),
	quoteId: integer("quote_id").notNull(),
	text: text("text").notNull(),
	author: text("author"),
	quoterID: text("quoter_id"),
	editorID: text("editor_id"),
	ogMessageID: text("og_message_id"),
	ogChannelID: text("og_channel_id"),
	createdTimestamp: integer("created_timestamp")
		.notNull()
		.default(sql`(unixepoch() * 1000)`),
	editedTimestamp: integer("edited_timestamp"),
});

export type Guild = typeof guilds.$inferSelect;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
