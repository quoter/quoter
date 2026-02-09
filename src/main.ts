import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import { events } from "@/events";
import { sqlite } from "@/lib/db";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
	allowedMentions: { parse: [] },
	makeCache: Options.cacheWithLimits({
		MessageManager: 0,
		ThreadManager: 0,
	}),
	shards: "auto",
});

if (process.env.DISCORD_TOKEN === undefined) {
	throw new Error("DISCORD_TOKEN environment variable not set");
}
client
	.on(Events.ClientReady, events.ready)
	.on(Events.GuildDelete, events.guildDelete)
	.on(Events.InteractionCreate, events.interactionCreate);

client.login(process.env.DISCORD_TOKEN);

process.on("SIGINT", async () => {
	sqlite.close();
	console.log("Closed SQLite connection");

	await client.destroy();
	console.log("Destroyed client");

	process.exit(0);
});
