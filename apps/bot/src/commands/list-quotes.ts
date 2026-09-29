import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
  InteractionReplyOptions,
  InteractionUpdateOptions,
} from "discord.js";

import type { QuoterCommand } from "@/commands";
import { countGuildQuotes, listQuotes } from "@/db";
import { cleanString } from "@/lib/utils";

export function renderQuoteList({
  page,
  guildId,
  userId,
}: {
  page: number;
  guildId: string;
  userId: string;
}): InteractionReplyOptions & InteractionUpdateOptions {
  const quotePage = listQuotes(guildId, page);
  const { quotes } = quotePage;

  if (quotes.length === 0) {
    return {
      components: [],
      content:
        "❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
      embeds: [],
    };
  }
  const { page: resolvedPage } = quotePage;
  const maxPage = quotePage.totalPages;
  const quoteList = quotes
    .map((quote) => {
      const text =
        quote.text.length > 30 ? `${quote.text.slice(0, 30)}...` : quote.text;
      const author =
        quote.author && quote.author.length > 10
          ? `${quote.author.slice(0, 10)}...`
          : quote.author;
      return `**${quote.quoteNumber}**. "${cleanString(text)}"${
        author ? ` - ${cleanString(author)}` : ""
      }`;
    })
    .join("\n");

  return {
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`listquotes_u${userId}p${resolvedPage - 1}`)
          .setLabel("⬅️ Prev")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(resolvedPage === 1),
        new ButtonBuilder()
          .setCustomId(`listquotes_u${userId}p${resolvedPage + 1}`)
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(page === maxPage)
      ),
    ],
    embeds: [
      new EmbedBuilder()
        .setTitle(`📜 Server Quotes • Page #${resolvedPage} of ${maxPage}`)
        .setColor(Colors.Blue)
        .setDescription(`Use \`/quote\` to view a specific quote.

${quoteList}`),
    ],
  };
}

export async function handleListQuoteButtonPress(
  interaction: ButtonInteraction
) {
  const match = interaction.customId.match(
    /listquotes_u(?<userId>\d+)p(?<page>\d+)/u
  );
  if (!match) {
    return;
  }
  const { page: pageValue, userId } = match.groups ?? {};
  if (!userId || !pageValue) {
    return;
  }
  const page = Math.trunc(Number(pageValue));

  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "❌ **|** These buttons are not for you!",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!interaction.guild) {
    await interaction.reply({
      content: "❌ **|** This command can only be used in a server.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const quoteList = await renderQuoteList({
    guildId: interaction.guild.id,
    page,
    userId,
  });
  await interaction.update(quoteList);
}

const ListQuotesCommand: QuoterCommand = {
  cooldown: 3,
  data: new SlashCommandBuilder()
    .setName("list-quotes")
    .setDescription("See all quotes in this server's quote book")
    .addIntegerOption((o) =>
      o.setName("page").setDescription("The page of the quote book to view")
    )
    .setContexts(InteractionContextType.Guild),
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: "❌ **|** This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const quoteCount = countGuildQuotes(interaction.guild.id);
    if (quoteCount === 0) {
      await interaction.reply({
        content:
          "❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const page = interaction.options.getInteger("page") || 1;
    const maxPage = Math.ceil(quoteCount / 10);
    if (page > maxPage) {
      await interaction.reply({
        content: `❌ **|** That page is too high! The maximum page is **${maxPage}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const quoteList = await renderQuoteList({
      guildId: interaction.guild.id,
      page,
      userId: interaction.user.id,
    });

    await interaction.reply(quoteList);
  },
};

export default ListQuotesCommand;
