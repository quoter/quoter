import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { guilds, quotes } from "@/db/schema";

const migrationsFolder = Bun.isStandaloneExecutable
	? `${import.meta.dir}/drizzle`
	: `${import.meta.dir}/../../drizzle`;
const createClient = (sqlite: Database) =>
	drizzle({ client: sqlite, schema: { guilds, quotes } });

let sqlite: Database | undefined;
let db: ReturnType<typeof createClient> | undefined;

export function initializeDatabase(path: string = ":memory:") {
	if (db) throw new Error("Database is already initialized");
	sqlite = new Database(path, { create: true, strict: true });
	sqlite.exec("PRAGMA foreign_keys = ON");
	sqlite.exec("PRAGMA busy_timeout = 5000");
	if (path !== ":memory:") sqlite.exec("PRAGMA journal_mode = WAL");
	db = createClient(sqlite);
	migrate(db, { migrationsFolder });
	return db;
}

export function getDatabase() {
	if (!db) throw new Error("Database is not initialized");
	return db;
}

export function getSqlite() {
	if (!sqlite) throw new Error("Database is not initialized");
	return sqlite;
}

export function closeDatabase(): void {
	sqlite?.close();
	sqlite = undefined;
	db = undefined;
}
