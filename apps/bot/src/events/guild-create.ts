import type { Guild } from "discord.js";
import { getStore } from "@/db";

export function guildCreate(guild: Guild): void {
	getStore().ensureGuild(guild.id);
	console.log(`Observed guild ${guild.name} (${guild.id})`);
}
