import { ActivityType } from "discord.js";
import type { Client } from "discord.js";

import { commands } from "@/commands";
import { getConfig } from "@/config";
import { deleteGuildsLeftBefore, reconcileGuilds } from "@/db";
import { setManagedInterval } from "@/lib/timers";

function cleanup(client: Client<true>) {
  const marked = reconcileGuilds(client.guilds.cache.keys());
  if (marked > 0) {
    console.log(`Marked ${marked} guilds as left`);
  }

  const retentionMs = getConfig().guildRetentionDays * 24 * 60 * 60 * 1000;
  const cutoff = Date.now() - retentionMs;
  const deleted = deleteGuildsLeftBefore(cutoff);
  if (deleted > 0) {
    console.log(`Deleted ${deleted} expired guilds`);
  }
}

export async function ready(client: Client<true>) {
  console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

  cleanup(client);
  setManagedInterval(() => cleanup(client), 24 * 60 * 60 * 1000);

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

  // overwriting existing commands doesn't count toward Discord's daily limit on
  // creating them, so this is fine to do on every startup
  const registered = await client.application.commands.set(
    [...commands.values()].map((c) => c.data.toJSON())
  );
  console.log(`Registered ${registered.size} commands`);
}
