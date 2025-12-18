import { SlashCommandBuilder } from "discord.js";
import type { QuoterCommand } from "@/commands";

const BugsCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("bugs")
		.setDescription(
			"Get a link to report bugs, suggest features, or post other issues",
		),
	async execute(interaction) {
		await interaction.reply({
			content:
				"🐛 **|** You can report bugs, suggest features, or post other issues on Quoter's [GitHub Issues](<https://github.com/n1ckoates/quoter/issues>) page.",
			ephemeral: true,
		});
	},
};

export default BugsCommand;
