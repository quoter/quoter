const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "quote",
	description: "Retrieves a random server quote",
	usage: "<quote id>",
	aliases: ["q", "randomquote", "randquote", "rquote"],
	cooldown: 5,
	args: false,
	guildOnly: true,
	supportGuildOnly: false,
	execute(message, args) {
		const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];
		if (!serverQuotes) {
			const noQuotesEmbed = new Discord.MessageEmbed()
				.setTitle("❌ No quotes found")
				.setColor(config.colors.error)
				.setDescription(
					`This server doesn't have any quotes saved, use \`${message.applicablePrefix}newquote\` to add some`
				);
			return message.channel.send(noQuotesEmbed);
		}

		let quote;

		if (args.length) {
			quote = serverQuotes[args[0]];
			if (!quote) {
				const quoteNotFoundEmbed = new Discord.MessageEmbed()
					.setTitle("❌ No quote found")
					.setColor(config.colors.error)
					.setDescription(
						`Couldn't find a quote with that number, use \`${message.applicablePrefix}newquote\` to add one`
					);
				return message.channel.send(quoteNotFoundEmbed);
			}
		} else {
			quote =
				serverQuotes[Math.floor(Math.random() * serverQuotes.length)];
		}

		const quoteEmbed = new Discord.MessageEmbed()
			.setColor(config.colors.general)
			.setDescription(
				`"${
					quote.text || "An error occured while retrieving that quote"
				}"`
			);

		const author = message.guild.members.resolve(quote.author);
		if (quote.author) {
			quoteEmbed.setAuthor(
				author.displayName,
				author.user.displayAvatarURL("png", true, 512)
			);
		}

		quoteEmbed.setFooter(`Quote #${serverQuotes.indexOf(quote)}`);

		message.channel.send(quoteEmbed);
	},
};
