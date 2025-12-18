import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import mongoose from "mongoose";
import { events } from "@/events";

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
	.on(Events.InteractionCreate, events.interactionCreate)
	.login(process.env.DISCORD_TOKEN);

if (process.env.MONGO_URI === undefined) {
	throw new Error("MONGO_URI environment variable not set");
}
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("Connected to mongoDB"));

process.on("SIGINT", async () => {
	await mongoose.connection.close();
	console.log("Closed mongoDB connection");

	await client.destroy();
	console.log("Destroyed client");

	process.exit(0);
});
