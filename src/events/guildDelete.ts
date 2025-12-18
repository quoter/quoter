import { Guild as DiscordGuild } from "discord.js";
import { Guild } from "../schemas/guild";

export default async function guildDelete(guild: DiscordGuild) {
	if (!guild.available) return; // Server outage

	await Guild.deleteOne({ _id: guild.id });
	console.log(`Deleted data for guild ${guild.name} (${guild.id})`);
}
