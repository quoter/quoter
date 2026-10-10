// One-off: converts a `mongoexport --jsonArray` dump of the legacy `guilds`
// collection into a fresh SQLite database.
//
//   mongoexport --uri "$MONGO_URI" --collection guilds --jsonArray --out guilds.json
//   bun run scripts/migrate-mongo.ts guilds.json quoter.sqlite

import { existsSync } from "node:fs";

import { z } from "zod";

import { closeDatabase, getDatabase, initializeDatabase } from "@/db";
import { guilds, quotes } from "@/db/schema";

const quoteSchema = z.object({
  author: z.string().nullish(),
  createdTimestamp: z.number().int().nonnegative().optional(),
  editedTimestamp: z.number().int().nonnegative().nullish(),
  editorID: z.string().nullish(),
  ogChannelID: z.string().nullish(),
  ogMessageID: z.string().nullish(),
  quoterID: z.string().nullish(),
  text: z.string().min(1),
});

const guildSchema = z.object({
  _id: z.string().min(1),
  maxGuildQuotes: z.number().int().nonnegative().nullish(),
  quotes: z.array(quoteSchema).default([]),
});

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  throw new Error("Usage: migrate-mongo.ts <guilds.json> <output.sqlite>");
}
if (existsSync(outputPath)) {
  throw new Error(`Destination already exists: ${outputPath}`);
}

const documents = z.array(guildSchema).parse(await Bun.file(inputPath).json());

initializeDatabase(outputPath);
const db = getDatabase();
const now = Date.now();

db.transaction(() => {
  for (const guild of documents) {
    db.insert(guilds)
      .values({
        createdAt: now,
        guildId: guild._id,
        lastSeenAt: now,
        maxQuotes: guild.maxGuildQuotes ?? null,
        nextQuoteNumber: guild.quotes.length + 1,
      })
      .run();
    if (guild.quotes.length === 0) {
      continue;
    }
    db.insert(quotes)
      .values(
        guild.quotes.map((quote, index) => ({
          author: quote.author ?? null,
          createdAt: quote.createdTimestamp ?? now,
          editedAt: quote.editedTimestamp ?? null,
          editorId: quote.editorID ?? null,
          guildId: guild._id,
          originalChannelId: quote.ogChannelID ?? null,
          originalMessageId: quote.ogMessageID ?? null,
          // array position is the quote number users know
          quoteNumber: index + 1,
          quoterId: quote.quoterID ?? null,
          text: quote.text,
        }))
      )
      .run();
  }
});

console.log(
  `Migrated ${documents.length} guilds, ${documents.reduce((total, guild) => total + guild.quotes.length, 0)} quotes`
);
closeDatabase();
