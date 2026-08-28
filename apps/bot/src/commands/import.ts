import {
	type ChatInputCommandInteraction,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { z } from "zod";
import type { QuoterCommand } from "@/commands";
import { GuildQuoteLimitError, importQuotes } from "@/db";
import { getGuildId, getGuildLimits } from "@/lib/guild";

const createImportSchema = (maxQuoteLength: number) =>
	z
		.object({
			text: z.string().min(1).max(maxQuoteLength).trim(),
			author: z.string().trim().nullish(),
			createdTimestamp: z.int().nonnegative().optional(),
			editedTimestamp: z.int().nonnegative().optional(),
		})
		.array()
		.nonempty();

const ImportCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("import")
		.setDescription("Import a JSON file to this server's quote book")
		.addAttachmentOption((o) =>
			o
				.setName("file")
				.setDescription("The JSON file to import")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	cooldown: 60,
	async execute(interaction: ChatInputCommandInteraction) {
		const attachment = interaction.options.getAttachment("file");
		if (attachment === null) throw new Error("File is null");

		if (!attachment.contentType?.startsWith("application/json")) {
			await interaction.reply({
				content: "❌ **|** The file must be a JSON file.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		if (attachment.size > 1024 * 1024 * 2) {
			await interaction.reply({
				content:
					"❌ **|** The file cannot be larger than 2 MB. Please split it into multiple files.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const resp = await fetch(attachment.url, {
			signal: AbortSignal.timeout(10_000),
		});
		if (!resp.ok) throw new Error(`Import download failed: ${resp.status}`);
		const json = await resp.json();
		const guildId = getGuildId(interaction);
		const limits = getGuildLimits(guildId);
		const parsed = createImportSchema(limits.maxQuoteLength).safeParse(json);

		if (!parsed.success) {
			await interaction.reply({
				content:
					"❌ **|** That file is not a valid quote book. Visit [quoter.cc/format](https://quoter.cc/format) for more information.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		try {
			importQuotes(
				guildId,
				parsed.data.map((quote) => ({
					text: quote.text,
					author: quote.author,
					createdAt: quote.createdTimestamp,
					editedAt: quote.editedTimestamp,
				})),
				limits.maxQuotes,
			);
		} catch (error) {
			if (!(error instanceof GuildQuoteLimitError)) throw error;
			await interaction.reply({
				content: `❌ **|** That file contains too many quotes. You can only have ${error.limit} quotes in this server.`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.reply({
			content: `✅ **|** Imported **${parsed.data.length}** quotes.`,
			flags: MessageFlags.Ephemeral,
		});
	},
};

export default ImportCommand;
