import type { Guild as DiscordGuild } from "discord.js";

import { markGuildLeft } from "@/db";

export function guildDelete(guild: DiscordGuild) {
  if (!guild.available) {
    // Server outage, ignore
    return;
  }

  markGuildLeft(guild.id);
  console.log(`Marked guild ${guild.name} (${guild.id}) as left`);
}
