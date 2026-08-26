import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { initializeConfig } from "@/config";
import { closeStore, initializeStore } from "@/db";
import { events } from "@/events";
import { clearManagedTimers } from "@/lib/timers";

const config = initializeConfig();
mkdirSync(dirname(config.databasePath), { recursive: true });
const store = initializeStore(config.databasePath);

console.log(
	`Starting Quoter v${config.version} (${config.buildSha.slice(0, 7)}), schema ${store.getSchemaVersion()}`,
);

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
	allowedMentions: { parse: [] },
	makeCache: Options.cacheWithLimits({
		...Options.DefaultMakeCacheSettings,
		MessageManager: 0,
		ThreadManager: 0,
		UserManager: 0,
		GuildMemberManager: 0,
		ReactionManager: 0,
		PresenceManager: 0,
		VoiceStateManager: 0,
		GuildInviteManager: 0,
	}),
	shards: "auto",
});

client
	.on(Events.ClientReady, events.ready)
	.on(Events.GuildCreate, events.guildCreate)
	.on(Events.GuildDelete, events.guildDelete)
	.on(Events.InteractionCreate, events.interactionCreate);

let shuttingDown = false;

async function shutdown(exitCode: number): Promise<void> {
	if (shuttingDown) return;
	shuttingDown = true;
	clearManagedTimers();
	client.destroy();
	closeStore();
	process.exitCode = exitCode;
}

process.once("SIGINT", () => void shutdown(0));
process.once("SIGTERM", () => void shutdown(0));
process.on("unhandledRejection", (error) => {
	console.error("Unhandled promise rejection", error);
	void shutdown(1);
});
process.on("uncaughtException", (error) => {
	console.error("Uncaught exception", error);
	void shutdown(1);
});

try {
	await client.login(config.discordToken);
} catch (error) {
	console.error("Discord login failed", error);
	await shutdown(1);
}
