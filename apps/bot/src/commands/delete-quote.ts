import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

import type { QuoterCommand } from "@/commands";
import { deleteQuote, getQuote } from "@/db";
import { getGuildId } from "@/lib/guild";

const DeleteQuoteCommand: QuoterCommand = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("delete-quote")
    .setDescription("Delete a quote from this server's quote book")
    .addIntegerOption((o) =>
      o
        .setName("id")
        .setDescription("The ID of the quote to delete")
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  async execute(interaction: ChatInputCommandInteraction) {
    const id = interaction.options.getInteger("id");
    if (id === null) {
      throw new Error("ID is null");
    }

    const guildId = getGuildId(interaction);
    const quote = getQuote(guildId, id);

    if (!quote) {
      await interaction.reply({
        content: "❌ **|** I couldn't find a quote with that ID.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    deleteQuote(guildId, id);
    await interaction.reply({
      content: `✅ **|** Deleted quote #${id}.`,
    });
  },
};

export default DeleteQuoteCommand;
