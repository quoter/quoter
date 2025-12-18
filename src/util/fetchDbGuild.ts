import type { CommandInteraction } from "discord.js";
import { Guild } from "../schemas/guild";

export default async function fetchDbGuild(interaction: CommandInteraction) {
	if (!interaction.guild) {
		throw new Error("Interaction is not in a guild.");
	}

	return await Guild.findOneAndUpdate(
		{ _id: interaction.guild.id },
		{},
		{ upsert: true, new: true },
	);
}
