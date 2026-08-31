import { existsSync, unlinkSync } from "node:fs";
import { MongoClient } from "mongodb";
import { z } from "zod";
import {
	checkIntegrity,
	closeDatabase,
	getDatabase,
	getSchemaVersion,
	initializeDatabase,
	type LegacyGuild,
	migrateLegacyGuild,
} from "@/db";

const legacyQuoteSchema = z.object({
	text: z.string().min(1),
	author: z.string().nullish(),
	quoterID: z.string().nullish(),
	editorID: z.string().nullish(),
	ogMessageID: z.string().nullish(),
	ogChannelID: z.string().nullish(),
	createdTimestamp: z.number().int().nonnegative().optional(),
	editedTimestamp: z.number().int().nonnegative().nullish(),
});

const legacyGuildSchema = z.object({
	_id: z.string().min(1),
	maxGuildQuotes: z.number().int().nonnegative().nullish(),
	quotes: z.array(legacyQuoteSchema).default([]),
});

export interface MigrationReport {
	guildCount: number;
	quoteCount: number;
	guilds: Array<{ guildId: string; quoteCount: number }>;
	schemaVersion: number;
	integrityCheck: "ok";
}

export function parseLegacyGuild(document: unknown): LegacyGuild {
	const guild = legacyGuildSchema.parse(document);
	return {
		guildId: guild._id,
		maxQuotes: guild.maxGuildQuotes ?? null,
		quotes: guild.quotes.map((quote) => ({
			text: quote.text,
			author: quote.author ?? null,
			quoterId: quote.quoterID ?? null,
			editorId: quote.editorID ?? null,
			originalMessageId: quote.ogMessageID ?? null,
			originalChannelId: quote.ogChannelID ?? null,
			createdAt: quote.createdTimestamp,
			editedAt: quote.editedTimestamp ?? null,
		})),
	};
}

export function migrateLegacyDocuments(
	documents: unknown[],
	now: number = Date.now(),
): MigrationReport {
	const parsed = documents.map(parseLegacyGuild);
	getDatabase().transaction(() => {
		for (const guild of parsed) migrateLegacyGuild(guild, now);
	});

	if (!checkIntegrity()) throw new Error("SQLite integrity check failed");
	return {
		guildCount: parsed.length,
		quoteCount: parsed.reduce((total, guild) => total + guild.quotes.length, 0),
		guilds: parsed.map((guild) => ({
			guildId: guild.guildId,
			quoteCount: guild.quotes.length,
		})),
		schemaVersion: getSchemaVersion(),
		integrityCheck: "ok",
	};
}

interface CliOptions {
	mongoUri: string;
	sqlitePath: string;
	reportPath?: string;
	dryRun: boolean;
}

function parseCliOptions(arguments_: string[]): CliOptions {
	const valueAfter = (name: string): string | undefined => {
		const index = arguments_.indexOf(name);
		return index >= 0 ? arguments_[index + 1] : undefined;
	};
	const mongoUri = valueAfter("--mongo-uri") ?? process.env.MONGO_URI;
	const sqlitePath = valueAfter("--sqlite");
	if (!mongoUri) throw new Error("Provide --mongo-uri or MONGO_URI");
	if (!sqlitePath) throw new Error("Provide --sqlite");
	return {
		mongoUri,
		sqlitePath,
		reportPath: valueAfter("--report"),
		dryRun: arguments_.includes("--dry-run"),
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
		if (options.reportPath) await Bun.write(options.reportPath, reportJson);
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
