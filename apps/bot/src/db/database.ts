import { Database } from "bun:sqlite";

import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { guilds, quotes } from "@/db/schema";

const migrationsFolder = Bun.isStandaloneExecutable
  ? `${import.meta.dir}/drizzle`
  : `${import.meta.dir}/../../drizzle`;

function createClient(sqlite: Database) {
  return drizzle({ client: sqlite, schema: { guilds, quotes } });
}

let sqlite: Database | undefined;
let db: ReturnType<typeof createClient> | undefined;

export function initializeDatabase(path = ":memory:") {
  if (db) {
    throw new Error("Database is already initialized");
  }

  sqlite = new Database(path, { create: true, strict: true });

  // enforce foreign key constraints
  sqlite.run("PRAGMA foreign_keys = ON");

  // the bot's own queries never overlap, but other processes can use the
  // database at the same time (backups + manual edits)
  // WAL means reads and writes don't block each other, so backups can read
  // while the bot writes. writes still block writes though, so if another
  // process is writing, wait up to 5 seconds for it to finish instead of erroring
  sqlite.run("PRAGMA busy_timeout = 5000");

  // in-memory databases (used in tests) can't use WAL
  if (path !== ":memory:") {
    sqlite.run("PRAGMA journal_mode = WAL");
  }

  db = createClient(sqlite);
  migrate(db, { migrationsFolder });
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error("Database is not initialized");
  }
  return db;
}

export function getSqlite() {
  if (!sqlite) {
    throw new Error("Database is not initialized");
  }
  return sqlite;
}

export function closeDatabase(): void {
  sqlite?.close();
  sqlite = undefined;
  db = undefined;
}
