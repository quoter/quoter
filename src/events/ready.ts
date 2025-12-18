import { Guild } from "../schemas/guild";
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

		client.user?.setActivity(
			`The Quote Book for Discord | ${formattedServerCount} servers`,
			{
				type: ActivityType.Custom,
			},
		);
	};
	update();
	setInterval(update, 600000);
}
