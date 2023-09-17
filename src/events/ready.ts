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

import Guild from "../schemas/guild.js";
import { ActivityType, Client } from "discord.js";

export default async function ready(client: Client) {
	if (!client.user) throw new Error("Client user is not available");
	console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

	const currentGuilds = client.guilds.cache.map((g) => g.id);

	if (currentGuilds.length <= 0) {
		return console.warn(
			"An error occurred while retrieving guild cache, or this bot isn't in any guilds. Data deletion will be skipped.",
		);
	}

	// Delete guilds if their ID is not in the current guild cache
	const response = await Guild.deleteMany({
		_id: { $nin: currentGuilds },
	});
	console.log(`Deleted ${response.deletedCount} guilds from mongoDB`);

	const update = () => {
		const formattedServerCount = Intl.NumberFormat("en-US", {
			notation: "compact",
			maximumFractionDigits: 2,
		}).format(client.guilds.cache.size);

		// @ts-expect-error client.user will always be available if this function is executed
		client.user.setActivity(
			`The Quote Book for Discord | ${formattedServerCount} servers`,
			{
				type: ActivityType.Custom,
			},
		);
	};
	update();
	setInterval(update, 600000);
}
