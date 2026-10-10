import { MessageFlags, SlashCommandBuilder } from "discord.js";

import { defineSlashCommand } from "@/lib/command";

export const BugsCommand = defineSlashCommand({
  data: new SlashCommandBuilder()
    .setName("bugs")
    .setDescription(
      "Get a link to report bugs, suggest features, or post other issues"
    ),
  async execute(interaction) {
    await interaction.reply({
      content:
        "🐛 **|** You can report bugs, suggest features, or post other issues on Quoter's [GitHub Issues](<https://github.com/n1ckoates/quoter/issues>) page.",
      flags: MessageFlags.Ephemeral,
    });
  },
});
