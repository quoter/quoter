import {
  AttachmentBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

import type { QuoterCommand } from "@/commands";
import { exportQuotes } from "@/db";
import { getGuildId } from "@/lib/guild";

const ExportCommand: QuoterCommand = {
  cooldown: 60,
  data: new SlashCommandBuilder()
    .setName("export")
    .setDescription("Export this server's quote book as a JSON file")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const quotes = exportQuotes(getGuildId(interaction));

    const json = JSON.stringify(
      quotes.map((quote) => ({
        author: quote.author,
        createdTimestamp: quote.createdAt,
        editedTimestamp: quote.editedAt,
        quoteNumber: quote.quoteNumber,
        text: quote.text,
      })),
      null,
      2
    );
    const buffer = Buffer.from(json);
    const attachment = new AttachmentBuilder(buffer, {
      name: "quotes.json",
    });

    await interaction.reply({
      content: "📥 **|** Here are this server's quotes for download.",
      files: [attachment],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default ExportCommand;
