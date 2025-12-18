import {
	EmbedBuilder,
	SlashCommandBuilder,
	Colors,
	ChatInputCommandInteraction,
	InteractionContextType,
} from "discord.js";
import cleanString from "../util/cleanString";
import { QuoterCommand } from "../QuoterCommand";
import fetchDbGuild from "../util/fetchDbGuild";

const EightBallCommand: QuoterCommand = {
	data: new SlashCommandBuilder()
		.setName("8-ball")
		.setDescription(
			"Ask the magic 8-ball a question, and receive a quote in response",
		)
		.addStringOption((o) =>
			o
				.setName("question")
				.setDescription("The question to ask the magic 8-ball")
				.setRequired(true),
		)
		.setContexts(InteractionContextType.Guild),
	cooldown: 2,
	async execute(interaction: ChatInputCommandInteraction) {
		const question = interaction.options.getString("question");
		if (question === null) throw new Error("Question is null");

		const questionEmbed = new EmbedBuilder()
			.setColor(Colors.Purple)
			.setTitle("🎱 Magic 8-Ball")
			.setDescription(
				`You ask the magic 8-ball a question...\n\n> ${question}\n\n...and it responds with a quote:`,
			);

		const { quotes } = await fetchDbGuild(interaction);
		if (!quotes?.length) {
			await interaction.reply({
				content:
					"❌ **|** This server doesn't have any quotes stored, or none by that author. Use `/create-quote` to create one!",
				ephemeral: true,
			});
			return;
		}

		const id = Math.ceil(Math.random() * quotes.length);
		const quote = quotes[id - 1];

		const quoteEmbed = new EmbedBuilder()
			.setColor(Colors.Blue)
			.setDescription(`"${cleanString(quote.text, false)}"`)
			.setFooter({ text: `Quote #${id}` });

		if (interaction.guild === null) throw new Error("Guild is null");
		if (quote.ogMessageID && quote.ogChannelID) {
			quoteEmbed.setDescription(
				quoteEmbed.data.description +
					`\n> [Original Message](https://discord.com/channels/${interaction.guild.id}/${quote.ogChannelID}/${quote.ogMessageID})`,
			);
		}

		if (quote.createdTimestamp) {
			quoteEmbed.setTimestamp(
				quote.editedTimestamp || quote.createdTimestamp,
			);
		}

		if (quote.author) quoteEmbed.setAuthor({ name: quote.author });

		await interaction.reply({ embeds: [questionEmbed, quoteEmbed] });
	},
};

export default EightBallCommand;
