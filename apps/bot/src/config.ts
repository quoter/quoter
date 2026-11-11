import { z } from "zod";

import quoterPackage from "../package.json";

export const DEFAULT_MAX_GUILD_QUOTES = 2500;

// bun replaces this with the actual commit hash when building
declare const BUILD_SHA: string | undefined;
const buildSha = typeof BUILD_SHA === "string" ? BUILD_SHA : "development";

const configSchema = z.preprocess(
  (environment: NodeJS.ProcessEnv) => ({
    databasePath: environment["DATABASE_PATH"],
    discordAdminIds: environment["DISCORD_ADMIN_ID"],
    discordToken: environment["DISCORD_TOKEN"],
    guildRetentionDays: environment["GUILD_RETENTION_DAYS"],
    maxGuildQuotes: environment["MAX_GUILD_QUOTES"],
    maxQuoteLength: environment["MAX_QUOTE_LENGTH"],
  }),
  z.object({
    buildSha: z.string().default(buildSha),
    databasePath: z.string().min(1).default("./db/quoter.sqlite"),
    discordAdminIds: z
      .string()
      .optional()
      .default("")
      .transform((value) => new Set(value.split(/\s+/u).filter(Boolean))),
    discordToken: z.string().min(1, "DISCORD_TOKEN is required"),
    guildRetentionDays: z.coerce.number().int().positive().default(30),
    maxGuildQuotes: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_MAX_GUILD_QUOTES),
    maxQuoteLength: z.coerce.number().int().positive().default(250),
    version: z.string().default(quoterPackage.version),
  })
);

export type AppConfig = z.output<typeof configSchema>;

let config: AppConfig | undefined;

export function loadConfig(
  environment: NodeJS.ProcessEnv = process.env
): AppConfig {
  if (config) {
    throw new Error("Configuration is already loaded");
  }
  config = configSchema.parse(environment);
  return config;
}

export function getConfig(): AppConfig {
  if (!config) {
    throw new Error("Configuration is not loaded");
  }
  return config;
}
