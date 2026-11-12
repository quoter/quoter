import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createCanvas, GlobalFonts, loadImage } from "@napi-rs/canvas";
import type { SKRSContext2D } from "@napi-rs/canvas";
import { InteractionContextType, SlashCommandBuilder } from "discord.js";

import { inspireImages } from "@/assets/inspire-images";
import type { Quote } from "@/db";
import { getQuote, getRandomQuote } from "@/db";
import { defineSlashCommand } from "@/lib/command";
import { getGuildId } from "@/lib/guild";
import { quoteNotFoundMessage } from "@/lib/utils";

// compiled executables embed src/assets at the root of their virtual
// filesystem, as `assets` (see scripts/build.ts)
const assetsDirectory = Bun.isStandaloneExecutable
  ? path.resolve(import.meta.dir, "assets")
  : path.resolve(import.meta.dir, "../assets");

// canvas reads paths natively, which can't see a compiled executable's virtual
// filesystem, so assets are read with Bun and passed to canvas as buffers
GlobalFonts.register(
  readFileSync(path.resolve(assetsDirectory, "ScheherazadeNew-Regular.ttf")),
  "Scheherazade New"
);

const segmenter = new Intl.Segmenter(undefined, { granularity: "word" });

/**
 * Splits text into lines no wider than `maxWidth`. Lines break before words,
 * including within languages written without spaces, and punctuation stays
 * with the word before it. A word wider than `maxWidth` gets its own line.
 */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (text: string) => number
): string[] {
  const lines: string[] = [];
  let line = "";

  for (const { segment, isWordLike } of segmenter.segment(
    text.replaceAll(/\s+/gu, " ").trim()
  )) {
    const extended = line + segment;
    if (isWordLike && line.trim() && measure(extended) > maxWidth) {
      lines.push(line.trimEnd());
      line = segment;
    } else {
      line = extended;
    }
  }

  if (line.trim()) {
    lines.push(line.trimEnd());
  }
  return lines;
}

interface WrappedTextOptions {
  font: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minFontSize: number;
  maxFontSize: number;
  /** Space between lines, as a multiple of the font size. */
  lineHeight?: number;
}

/**
 * Draws text wrapped to fit within a box, at the largest font size that fits
 * (or `minFontSize` if none do). Uses the context's `textAlign` and
 * `fillStyle`, and treats `y` as the top of the box.
 */
function drawWrappedText(
  ctx: SKRSContext2D,
  text: string,
  options: WrappedTextOptions
): void {
  const lineHeight = options.lineHeight ?? 1.1;

  function layout(fontSize: number): string[] {
    ctx.font = `${fontSize}px "${options.font}"`;
    return wrapText(text, options.width, (t) => ctx.measureText(t).width);
  }

  // the position of a line, relative to the top of the box
  function linePosition(fontSize: number, index: number): number {
    return fontSize * (1 + index * lineHeight);
  }

  let fontSize = options.maxFontSize;
  let lines = layout(fontSize);
  while (
    fontSize > options.minFontSize &&
    linePosition(fontSize, lines.length - 1) > options.height
  ) {
    fontSize -= 1;
    lines = layout(fontSize);
  }

  for (const [index, line] of lines.entries()) {
    ctx.fillText(line, options.x, options.y + linePosition(fontSize, index));
  }
}

export const InspireCommand = defineSlashCommand({
  cooldown: 4,
  data: new SlashCommandBuilder()
    .setName("inspire")
    .setDescription("Generate an inspirational image from a quote")
    .addIntegerOption((o) =>
      o.setName("id").setDescription("The ID of the quote to use")
    )
    .addStringOption((o) =>
      o
        .setName("author")
        .setDescription(
          "The author to randomly select a quote from (case-insensitive)"
        )
    )
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    await interaction.deferReply();

    const choice = interaction.options.getInteger("id");
    const author = interaction.options.getString("author");

    if (choice !== null && author !== null) {
      await interaction.editReply({
        content: "❌ **|** You can't specify both an ID and an author.",
      });
      return;
    }

    const guildId = getGuildId(interaction);
    const quote: Quote | null =
      choice === null
        ? getRandomQuote(guildId, author)
        : getQuote(guildId, choice);

    if (!quote) {
      await interaction.editReply({
        content: quoteNotFoundMessage(choice, author),
      });
      return;
    }

    const index = Math.floor(Math.random() * inspireImages.length);

    const background = await loadImage(
      await readFile(path.resolve(assetsDirectory, `${index}.jpg`))
    );
    const imageData = inspireImages[index];
    if (!imageData) {
      throw new Error(`Missing inspire image data at index ${index}`);
    }

    const canvas = createCanvas(background.width, background.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(background, 0, 0);

    ctx.textBaseline = "middle";
    ctx.textAlign = imageData.multiline.textAlign;

    // draw the quote, as large as fits in the image's text box
    drawWrappedText(ctx, `"${quote.text}"`, {
      font: imageData.multiline.font,
      height: imageData.multiline.rect.height,
      maxFontSize: imageData.multiline.maxFontSize,
      minFontSize: imageData.multiline.minFontSize,
      width: canvas.width - imageData.multiline.rect.widthPadding * 2,
      x: canvas.width * imageData.multiline.rect.xFactor,
      y: imageData.multiline.rect.y,
    });

    if (quote.author) {
      ctx.textAlign = imageData.author.textAlign;
      ctx.font = imageData.author.font;
      ctx.fillStyle = imageData.author.color;
      ctx.fillText(
        `- ${quote.author}`,
        canvas.width - imageData.author.widthPadding * 2,
        canvas.height - imageData.author.heightPadding * 2,
        canvas.width - 200
      );
    }

    const jpeg = await canvas.encode("jpeg");

    await interaction.editReply({
      files: [jpeg],
    });
  },
});
