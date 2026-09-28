import { existsSync, unlinkSync } from "node:fs";

import { MongoClient } from "mongodb";
import { z } from "zod";

import {
  checkIntegrity,
  closeDatabase,
  getDatabase,
  getSchemaVersion,
  initializeDatabase,
  migrateLegacyGuild,
} from "@/db";
import type { LegacyGuild } from "@/db";

const legacyQuoteSchema = z.object({
  author: z.string().nullish(),
  createdTimestamp: z.number().int().nonnegative().optional(),
  editedTimestamp: z.number().int().nonnegative().nullish(),
  editorID: z.string().nullish(),
  ogChannelID: z.string().nullish(),
  ogMessageID: z.string().nullish(),
  quoterID: z.string().nullish(),
  text: z.string().min(1),
});

const legacyGuildSchema = z.object({
  _id: z.string().min(1),
  maxGuildQuotes: z.number().int().nonnegative().nullish(),
  quotes: z.array(legacyQuoteSchema).default([]),
});

export interface MigrationReport {
  guildCount: number;
  quoteCount: number;
  guilds: { guildId: string; quoteCount: number }[];
  schemaVersion: number;
  integrityCheck: "ok";
}

export function parseLegacyGuild(document: unknown): LegacyGuild {
  const guild = legacyGuildSchema.parse(document);
  return {
    guildId: guild._id,
    maxQuotes: guild.maxGuildQuotes ?? null,
    quotes: guild.quotes.map((quote) => ({
      author: quote.author ?? null,
      createdAt: quote.createdTimestamp,
      editedAt: quote.editedTimestamp ?? null,
      editorId: quote.editorID ?? null,
      originalChannelId: quote.ogChannelID ?? null,
      originalMessageId: quote.ogMessageID ?? null,
      quoterId: quote.quoterID ?? null,
      text: quote.text,
    })),
  };
}

export function migrateLegacyDocuments(
  documents: unknown[],
  now: number = Date.now()
): MigrationReport {
  const parsed = documents.map(parseLegacyGuild);
  getDatabase().transaction(() => {
    for (const guild of parsed) {
      migrateLegacyGuild(guild, now);
    }
  });

  if (!checkIntegrity()) {
    throw new Error("SQLite integrity check failed");
  }
  return {
    guildCount: parsed.length,
    guilds: parsed.map((guild) => ({
      guildId: guild.guildId,
      quoteCount: guild.quotes.length,
    })),
    integrityCheck: "ok",
    quoteCount: parsed.reduce((total, guild) => total + guild.quotes.length, 0),
    schemaVersion: getSchemaVersion(),
  };
}

interface CliOptions {
  mongoUri: string;
  sqlitePath: string;
  reportPath?: string;
  dryRun: boolean;
}

function parseCliOptions(arguments_: string[]): CliOptions {
  function valueAfter(name: string): string | undefined {
    const index = arguments_.indexOf(name);
    return index === -1 ? undefined : arguments_[index + 1];
  }
  const mongoUri = valueAfter("--mongo-uri") ?? process.env["MONGO_URI"];
  const sqlitePath = valueAfter("--sqlite");
  if (!mongoUri) {
    throw new Error("Provide --mongo-uri or MONGO_URI");
  }
  if (!sqlitePath) {
    throw new Error("Provide --sqlite");
  }
  return {
    dryRun: arguments_.includes("--dry-run"),
    mongoUri,
    reportPath: valueAfter("--report"),
    sqlitePath,
  };
}

export async function runMigrationCli(arguments_: string[]): Promise<void> {
  const options = parseCliOptions(arguments_);
  if (!options.dryRun && existsSync(options.sqlitePath)) {
    throw new Error(`Destination already exists: ${options.sqlitePath}`);
  }

  const client = new MongoClient(options.mongoUri);
  initializeDatabase(options.dryRun ? ":memory:" : options.sqlitePath);
  try {
    await client.connect();
    const documents = await client.db().collection("guilds").find({}).toArray();
    const report = migrateLegacyDocuments(documents);
    const reportJson = JSON.stringify(report, null, 2);
    if (options.reportPath) {
      await Bun.write(options.reportPath, reportJson);
    }
    console.log(reportJson);
  } catch (error) {
    closeDatabase();
    if (!options.dryRun && existsSync(options.sqlitePath)) {
      unlinkSync(options.sqlitePath);
    }
    throw error;
  } finally {
    await client.close();
  }
  closeDatabase();
}

if (import.meta.main) {
  await runMigrationCli(process.argv.slice(2));
}
