const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "quote",
	description: "Displays a specified quote or a random one.",
	usage: "<id>",
	example: "",
	aliases: ["q", "randomquote", "randquote", "rquote"],
	cooldown: 5,
	args: false,
	guildOnly: true,
	supportGuildOnly: false,
	async execute(message, args) {
		const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];
		if (!serverQuotes.length) {
			const noQuotesEmbed = new Discord.MessageEmbed()
				.setTitle("❌ No quotes found")
				.setColor(config.colors.error)
				.setDescription(
					`This server doesn't have any quotes saved, use \`${message.applicablePrefix}newquote\` to add some`
				);
			return await message.channel.send(noQuotesEmbed);
		}

		let quote;

		if (args.length) {
			quote = serverQuotes[args[0] - 1];
			if (!quote) {
				const quoteNotFoundEmbed = new Discord.MessageEmbed()
					.setTitle("❌ No quote found")
					.setColor(config.colors.error)
					.setDescription(
						`Couldn't find a quote with that ID, use \`${message.applicablePrefix}newquote\` to add one.`
					);
				return await message.channel.send(quoteNotFoundEmbed);
			}
		} else {
			quote =
				serverQuotes[Math.floor(Math.random() * serverQuotes.length)];
		}

		const quoteEmbed = new Discord.MessageEmbed()
			.setColor(config.colors.general)
			.setDescription(
				`"${
					quote.text ||
					"An error occurred while retrieving that quote"
				}"`
			);

		if (quote.createdTimestamp) {
			quoteEmbed.setTimestamp(
				quote.editedTimestamp || quote.createdTimestamp
			);
		}

		if (quote.author && quote.author.length > 1) {
			quoteEmbed.setAuthor(quote.author);
		}

		quoteEmbed.setFooter(`Quote #${serverQuotes.indexOf(quote) + 1}`);

		await message.channel.send(quoteEmbed);
	},
};
