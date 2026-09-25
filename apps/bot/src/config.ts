import { z } from "zod";
import quoterPackage from "../package.json";

type Environment = Record<string, string | undefined>;

const configSchema = z.preprocess(
	(environment: Environment) => ({
		discordToken: environment["DISCORD_TOKEN"],
		discordAdminIds: environment["DISCORD_ADMIN_ID"],
		discordGuildId: environment["DISCORD_GUILD_ID"],
		databasePath: environment["DATABASE_PATH"],
		maxGuildQuotes: environment["MAX_GUILD_QUOTES"],
		maxQuoteLength: environment["MAX_QUOTE_LENGTH"],
		guildRetentionDays: environment["GUILD_RETENTION_DAYS"],
		buildSha: environment["BUILD_SHA"],
	}),
	z.object({
		discordToken: z.string().min(1, "DISCORD_TOKEN is required"),
		discordAdminIds: z
			.string()
			.optional()
			.default("")
			.transform((value) => new Set(value.split(/\s+/).filter(Boolean))),
		discordGuildId: z.string().optional(),
		databasePath: z.string().min(1).default("./db/quoter.sqlite"),
		maxGuildQuotes: z.coerce.number().int().positive().default(500),
		maxQuoteLength: z.coerce.number().int().positive().default(250),
		guildRetentionDays: z.coerce.number().int().positive().default(30),
		version: z.string().default(quoterPackage.version),
		buildSha: z.string().min(1).default("development"),
	}),
);

export type AppConfig = z.output<typeof configSchema>;

let config: AppConfig | undefined;

export function loadConfig(
	environment: Environment = process.env,
): AppConfig {
	if (config) throw new Error("Configuration is already loaded");
	config = configSchema.parse(environment);
	return config;
}

export function getConfig(): AppConfig {
	if (!config) throw new Error("Configuration is not loaded");
	return config;
}
