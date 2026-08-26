import type { Guild as DiscordGuild } from "discord.js";
import { getStore } from "@/db";

export async function guildDelete(guild: DiscordGuild) {
	if (!guild.available) return; // Server outage

	getStore().markGuildLeft(guild.id);
	console.log(`Marked guild ${guild.name} (${guild.id}) as left`);
}
