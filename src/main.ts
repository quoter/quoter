/*
Copyright (C) 2020-2023 Nick Oates

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

console.log(
	"   ____              _            \r\n  / __ \\            | |           \r\n | |  | |_   _  ___ | |_ ___ _ __ \r\n | |  | | | | |/ _ \\| __/ _ \\ '__|\r\n | |__| | |_| | (_) | ||  __/ |   \r\n  \\___\\_\\\\__,_|\\___/ \\__\\___|_|   \r\n                                  \r\n                                  ",
);

import { Client, Events, GatewayIntentBits, Options } from "discord.js";
import mongoose from "mongoose";
import events from "./events";
import config from "../config.json";

const client = new Client({
	intents: [GatewayIntentBits.Guilds],
	allowedMentions: { parse: [] },
	makeCache: Options.cacheWithLimits({
		MessageManager: 0,
		ThreadManager: 0,
	}),
});

client.on(Events.ClientReady, events.ready);
client.on(Events.GuildDelete, events.guildDelete);
client.on(Events.InteractionCreate, events.interactionCreate);

await mongoose.connect(config.mongoPath);
mongoose.connection.on("connected", () => console.log("Connected to mongoDB"));

process.on("SIGINT", async () => {
	await mongoose.connection.close();
	console.log("Closed mongoDB connection");

	client.destroy();
	console.log("Destroyed client");

	process.exit(0);
});

client.login(config.token);
