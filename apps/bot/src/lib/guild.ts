import type { BaseInteraction } from "discord.js";
import { getConfig } from "@/config";
import { ensureGuild, getGuildSettings } from "@/db";

export function getGuildId(interaction: BaseInteraction): string {
	if (!interaction.guildId) throw new Error("Interaction is not in a guild");
	return interaction.guildId;
}

export function getGuildLimits(guildId: string): {
	maxQuotes: number;
	maxQuoteLength: number;
} {
	ensureGuild(guildId);
	const settings = getGuildSettings(guildId);
	if (!settings) throw new Error("Guild was not initialized");
	const config = getConfig();
	return {
		maxQuotes: settings.maxQuotes ?? config.maxGuildQuotes,
		maxQuoteLength: settings.maxQuoteLength ?? config.maxQuoteLength,
	};
}
