import {
	AttachmentBuilder,
	InteractionContextType,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { fetchDbGuild } from "@/lib/utils";

const ExportCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("export")
		.setDescription("Export this server's quote book as a JSON file")
		.setContexts(InteractionContextType.Guild)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
	cooldown: 60,
	async execute(interaction) {
		const { quotes } = await fetchDbGuild(interaction);

		const json = JSON.stringify(
			quotes,
			["text", "author", "createdTimestamp", "editedTimestamp"],
			" ",
		);
		const buffer = Buffer.from(json);
		const attachment = new AttachmentBuilder(buffer, {
			name: "quotes.json",
		});

		await interaction.reply({
			content: "📥 **|** Here are this server's quotes for download.",
			files: [attachment],
			ephemeral: true,
		});
	},
};

export default ExportCommand;
