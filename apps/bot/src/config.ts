import { z } from "zod";
import quoterPackage from "../package.json";

const positiveInteger = (name: string, fallback: number) =>
	z
		.string()
		.optional()
		.transform((value, context) => {
			if (value === undefined || value === "") return fallback;
			const parsed = Number.parseInt(value, 10);
			if (!Number.isSafeInteger(parsed) || parsed < 1) {
				context.addIssue({
					code: "custom",
					message: `${name} must be a positive integer`,
				});
				return z.NEVER;
			}
			return parsed;
		});

const environmentSchema = z.object({
	DISCORD_TOKEN: z.string().min(1, "DISCORD_TOKEN is required"),
	DISCORD_ADMIN_ID: z.string().optional().default(""),
	DISCORD_GUILD_ID: z.string().optional(),
	DATABASE_PATH: z.string().min(1).default("./db/quoter.sqlite"),
	MAX_GUILD_QUOTES: positiveInteger("MAX_GUILD_QUOTES", 500),
	MAX_QUOTE_LENGTH: positiveInteger("MAX_QUOTE_LENGTH", 250),
	GUILD_RETENTION_DAYS: positiveInteger("GUILD_RETENTION_DAYS", 30),
	BUILD_SHA: z.string().min(1).default("development"),
});

export interface AppConfig {
	discordToken: string;
	discordAdminIds: Set<string>;
	discordGuildId?: string;
	databasePath: string;
	maxGuildQuotes: number;
	maxQuoteLength: number;
	guildRetentionDays: number;
	version: string;
	buildSha: string;
}

export function loadConfig(
	environment: Record<string, string | undefined> = process.env,
): AppConfig {
	const parsed = environmentSchema.parse(environment);
	return {
		discordToken: parsed.DISCORD_TOKEN,
		discordAdminIds: new Set(
			parsed.DISCORD_ADMIN_ID.split(/\s+/).filter(Boolean),
		),
		discordGuildId: parsed.DISCORD_GUILD_ID,
		databasePath: parsed.DATABASE_PATH,
		maxGuildQuotes: parsed.MAX_GUILD_QUOTES,
		maxQuoteLength: parsed.MAX_QUOTE_LENGTH,
		guildRetentionDays: parsed.GUILD_RETENTION_DAYS,
		version: quoterPackage.version,
		buildSha: parsed.BUILD_SHA,
	};
}

let config: AppConfig | undefined;

export function initializeConfig(
	environment: Record<string, string | undefined> = process.env,
): AppConfig {
	if (config) throw new Error("Configuration is already initialized");
	config = loadConfig(environment);
	return config;
}

export function getConfig(): AppConfig {
	if (!config) throw new Error("Configuration is not initialized");
	return config;
}

export function resetConfigForTests(): void {
	config = undefined;
}
