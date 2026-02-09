import type { Guild as DiscordGuild } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { guilds } from "@/lib/db/schema";

export async function guildDelete(guild: DiscordGuild) {
	if (!guild.available) return; // Server outage

	await db.delete(guilds).where(eq(guilds.id, guild.id));
	console.log(`Deleted data for guild ${guild.name} (${guild.id})`);
}
