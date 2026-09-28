import { ActivityType } from "discord.js";
import type { Client } from "discord.js";

import { getConfig } from "@/config";
import { deleteGuildsNotSeenSince, touchGuilds } from "@/db";
import { setManagedInterval } from "@/lib/timers";

function cleanup() {
  const retentionMs = getConfig().guildRetentionDays * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  const deleted = deleteGuildsNotSeenSince(cutoff);
  if (deleted > 0) {
    console.log(`Deleted ${deleted} expired guilds`);
  }
}

export function ready(client: Client) {
  if (!client.user) {
    throw new Error("Client user is not available");
  }
  console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

  const currentGuilds = client.guilds.cache.map((g) => g.id);
  touchGuilds(currentGuilds);

  cleanup();
  setManagedInterval(cleanup, 24 * 60 * 60 * 1000);

  function update() {
    if (!client.user) {
      return;
    }

    const formattedServerCount = Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
      notation: "compact",
    }).format(client.guilds.cache.size);

    client.user.setActivity(
      `The Quote Book for Discord | ${formattedServerCount} servers`,
      {
        type: ActivityType.Custom,
      }
    );
  }

  update();
  setManagedInterval(update, 600_000);
}
