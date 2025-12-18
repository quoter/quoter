import {
	EmbedBuilder,
	SlashCommandBuilder,
	Colors,
	InteractionContextType,
	ChatInputCommandInteraction,
} from "discord.js";
import { QuoterCommand } from "../QuoterCommand";
import fetchDbGuild from "../util/fetchDbGuild";

const WhoQuotedCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("who-quoted")
		.setDescription("See who created a specific quote")
		.addIntegerOption((o) =>
			o
				.setName("id")
				.setDescription("The ID of the quote to view")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 2,
	async execute(interaction: ChatInputCommandInteraction) {
		const { quotes } = await fetchDbGuild(interaction);

		if (!quotes.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored. Use `/create-quote` to create one!",
				ephemeral: true,
			});
			return;
		}

		const id = interaction.options.getInteger("id");
		if (id === null) throw new Error("ID is null");
		const quote = quotes[id - 1];
		if (!quote) {
			await interaction.reply({
				content: "❌ **|** I couldn't find a quote with that ID.",
				ephemeral: true,
			});
			return;
		}

		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Green)
					.setDescription(
						`Quote #${id} was created by <@${quote.quoterID}>.`,
					),
			],
		});
	},
};

export default WhoQuotedCommand;
