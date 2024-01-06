/*
Copyright (C) 2020-2024 Nick Oates

This file is part of Quoter.

Quoter is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.

Quoter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Quoter.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import mongoose from "mongoose";
import events from "./events";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
	allowedMentions: { parse: [] },
	makeCache: Options.cacheWithLimits({
		MessageManager: 0,
		ThreadManager: 0,
	}),
});

if (process.env.DISCORD_TOKEN === undefined) {
	console.error("DISCORD_TOKEN environment variable not set");
	process.exit(1);
}
client
	.on(Events.ClientReady, events.ready)
	.on(Events.GuildDelete, events.guildDelete)
	.on(Events.InteractionCreate, events.interactionCreate)
	.login(process.env.DISCORD_TOKEN);

if (process.env.MONGO_URI === undefined) {
	console.error("MONGO_URI environment variable not set");
	process.exit(1);
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
