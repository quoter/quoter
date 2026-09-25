import type { Guild } from "discord.js";
import { ensureGuild } from "@/db";

export function guildCreate(guild: Guild): void {
	ensureGuild(guild.id);
	console.log(`Observed guild ${guild.name} (${guild.id})`);
}
