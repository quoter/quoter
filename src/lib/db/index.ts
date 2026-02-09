import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

// Use environment variable or default to local file
const dbPath = process.env.SQLITE_DB_PATH || "./quoter.db";

// Create the SQLite database connection
const sqlite = new Database(dbPath, { create: true });

// Enable foreign keys
sqlite.exec("PRAGMA foreign_keys = ON;");

// Create drizzle instance
export const db = drizzle(sqlite, { schema });

// Initialize tables if they don't exist
function initDb() {
	// Create guilds table
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS guilds (
			id TEXT PRIMARY KEY,
			max_guild_quotes INTEGER,
			quote_incr INTEGER NOT NULL DEFAULT 1
		)
	`);

	// Create quotes table
	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS quotes (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			guild_id TEXT NOT NULL,
			quote_id INTEGER NOT NULL,
			text TEXT NOT NULL,
			author TEXT,
			quoter_id TEXT,
			editor_id TEXT,
			og_message_id TEXT,
			og_channel_id TEXT,
			created_timestamp INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
			edited_timestamp INTEGER,
			FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
			UNIQUE(guild_id, quote_id)
		)
	`);

	// Create indexes for faster lookups
	sqlite.exec(`
		CREATE INDEX IF NOT EXISTS idx_quotes_guild_id ON quotes(guild_id)
	`);

	sqlite.exec(`
		CREATE INDEX IF NOT EXISTS idx_quotes_guild_quote ON quotes(guild_id, quote_id)
	`);

	sqlite.exec(`
		CREATE INDEX IF NOT EXISTS idx_quotes_text ON quotes(text)
	`);

	sqlite.exec(`
		CREATE INDEX IF NOT EXISTS idx_quotes_author ON quotes(author)
	`);
}

// Run initialization
initDb();

export { sqlite };
