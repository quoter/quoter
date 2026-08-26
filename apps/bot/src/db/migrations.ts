import type { Database } from "bun:sqlite";

interface Migration {
	version: number;
	name: string;
	up: string;
}

const migrations: Migration[] = [
	{
		version: 1,
		name: "initial schema",
		up: `
			CREATE TABLE guilds (
				guild_id TEXT PRIMARY KEY,
				next_quote_number INTEGER NOT NULL DEFAULT 1 CHECK (next_quote_number >= 1),
				max_quotes INTEGER CHECK (max_quotes IS NULL OR max_quotes >= 0),
				max_quote_length INTEGER CHECK (max_quote_length IS NULL OR max_quote_length >= 0),
				last_seen_at INTEGER NOT NULL CHECK (last_seen_at >= 0),
				left_at INTEGER CHECK (left_at IS NULL OR left_at >= 0),
				created_at INTEGER NOT NULL CHECK (created_at >= 0)
			);

			CREATE TABLE quotes (
				guild_id TEXT NOT NULL,
				quote_number INTEGER NOT NULL CHECK (quote_number >= 1),
				text TEXT NOT NULL CHECK (length(text) > 0),
				author TEXT,
				quoter_id TEXT,
				editor_id TEXT,
				original_message_id TEXT,
				original_channel_id TEXT,
				created_at INTEGER NOT NULL CHECK (created_at >= 0),
				edited_at INTEGER CHECK (edited_at IS NULL OR edited_at >= 0),
				PRIMARY KEY (guild_id, quote_number),
				FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
			);

			CREATE INDEX quotes_guild_author
				ON quotes(guild_id, author COLLATE NOCASE);
			CREATE INDEX guilds_last_seen
				ON guilds(last_seen_at);
		`,
	},
];

export function migrateDatabase(database: Database): void {
	database.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			name TEXT NOT NULL,
			applied_at INTEGER NOT NULL
		)
	`);

	const appliedVersions = new Set(
		database
			.query<{ version: number }, []>(
				"SELECT version FROM schema_migrations ORDER BY version",
			)
			.all()
			.map(({ version }) => version),
	);

	const apply = database.transaction((migration: Migration) => {
		database.exec(migration.up);
		database
			.query(
				"INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
			)
			.run(migration.version, migration.name, Date.now());
	});

	for (const migration of migrations) {
		if (!appliedVersions.has(migration.version)) {
			apply(migration);
		}
	}
}

export function getSchemaVersion(database: Database): number {
	return (
		database
			.query<{ version: number }, []>(
				"SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations",
			)
			.get()?.version ?? 0
	);
}
