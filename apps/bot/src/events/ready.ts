import { ActivityType, type Client } from "discord.js";
import { getConfig } from "@/config";
import { getStore } from "@/db";
import { setManagedInterval } from "@/lib/timers";

export async function ready(client: Client) {
	if (!client.user) throw new Error("Client user is not available");
	console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

	const currentGuilds = client.guilds.cache.map((g) => g.id);
	getStore().touchGuilds(currentGuilds);

	const cleanup = () => {
		const cutoff =
			Date.now() - getConfig().guildRetentionDays * 24 * 60 * 60 * 1000;
		const deleted = getStore().deleteGuildsNotSeenSince(cutoff);
		if (deleted > 0) console.log(`Deleted ${deleted} expired guilds`);
	};
	cleanup();
	setManagedInterval(cleanup, 24 * 60 * 60 * 1000);

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
	setManagedInterval(update, 600_000);
}
