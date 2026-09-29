import { mkdirSync } from "node:fs";
import path from "node:path";

import { Client, Events, GatewayIntentBits, Options } from "discord.js";

import { loadConfig } from "@/config";
import {
  checkIntegrity,
  closeDatabase,
  getSchemaVersion,
  initializeDatabase,
} from "@/db";
import { events } from "@/events";
import { clearManagedTimers } from "@/lib/timers";

const config = loadConfig();
mkdirSync(path.dirname(config.databasePath), { recursive: true });
initializeDatabase(config.databasePath);

console.log(
  `Starting Quoter v${config.version} (${config.buildSha.slice(0, 7)}), schema ${getSchemaVersion()}`
);

if (process.argv.includes("--check")) {
  if (!checkIntegrity()) {
    throw new Error("SQLite integrity check failed");
  }
  console.log("Quoter executable check passed");
  closeDatabase();
  process.exit(0);
}

const client = new Client({
  allowedMentions: { parse: [] },
  intents: [GatewayIntentBits.Guilds],
  makeCache: Options.cacheWithLimits({
    ...Options.DefaultMakeCacheSettings,
    GuildInviteManager: 0,
    GuildMemberManager: 0,
    MessageManager: 0,
    PresenceManager: 0,
    ReactionManager: 0,
    ThreadManager: 0,
    UserManager: 0,
    VoiceStateManager: 0,
  }),
  shards: "auto",
});

client
  .on(Events.ClientReady, events.ready)
  .on(Events.GuildCreate, events.guildCreate)
  .on(Events.GuildDelete, events.guildDelete)
  .on(Events.InteractionCreate, events.interactionCreate);

let shuttingDown = false;

function shutdown(exitCode: number): void {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  clearManagedTimers();
  client.destroy();
  closeDatabase();
  process.exitCode = exitCode;
}

process.once("SIGINT", () => shutdown(0));
process.once("SIGTERM", () => shutdown(0));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection", error);
  shutdown(1);
});
process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
  shutdown(1);
});

try {
  await client.login(config.discordToken);
} catch (error) {
  console.error("Discord login failed", error);
  shutdown(1);
}
