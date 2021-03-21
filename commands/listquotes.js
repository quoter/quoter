const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "listquotes",
	description: "Lists all of the server's quotes",
	usage: "",
	example: "",
	aliases: ["quotelist", "quotes", "lq"],
	cooldown: 8,
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
					`This server doesn't have any quotes, use \`${message.applicablePrefix}newquote\` to add some!`
				);
			return await message.channel.send(noQuotesEmbed);
		}

		let quoteList = "";
		let quoteNumber = 1;
		serverQuotes.forEach((quote) => {
			if (quote.text && quote.text.length > 30)
				quote.text = `${quote.text.substr(0, 30)}...`;
			if (quote.author && quote.author.length > 10)
				quote.author = `${quote.author.substr(0, 10)}...`;

			quoteList += `**${quoteNumber}**. "${
				quote.text || "An error occurred"
			}"`;
			quoteNumber++;

			if (quote.author && quote.author.length > 0) {
				quoteList += ` - ${quote.author}`;
			}

			quoteList += "\n";
		});

		const quoteListEmbed = new Discord.MessageEmbed()
			.setTitle("Server Quotes")
			.setColor(config.colors.general)
			.setDescription(`Here's a list of this server's quotes. Quotes might've shortened due to Discord limitations, use \`${message.applicablePrefix}quote <id>\` to see a specific quote.
			
			${quoteList}`);
		await message.channel.send(quoteListEmbed);
	},
};
