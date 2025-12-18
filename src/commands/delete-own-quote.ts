import {
	type ChatInputCommandInteraction,
	InteractionContextType,
	SlashCommandBuilder,
} from "discord.js";
import type { QuoterCommand } from "@/commands";
import { fetchDbGuild } from "@/lib/utils";

const DeleteOwnQuoteCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("delete-own-quote")
		.setDescription("Delete a quote that you created")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to delete")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 5,
	async execute(interaction: ChatInputCommandInteraction) {
		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");

		const guild = await fetchDbGuild(interaction);
		const quote = guild.quotes[id - 1];

		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
			return;
		}

		if (quote.quoterID !== interaction.user.id) {
			await interaction.reply({
				content:
					"❌ **|** You can only delete quotes that you created. If you have permission to use `/delete-quote`, you can use that to delete any quote.",
				ephemeral: true,
			});
			return;
		}

		await quote.deleteOne();
		await guild.save();
		await interaction.reply({
			content: `✅ **|** Deleted quote #${id}.`,
		});
	},
};

export default DeleteOwnQuoteCommand;
