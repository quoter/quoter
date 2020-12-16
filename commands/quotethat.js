const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: true,
	hidden: false,
	name: "quotethat",
	description: "Quotes the last message in the current channel",
	usage: "",
	example: "",
	aliases: ["qthat"],
	cooldown: 10,
	args: false,
	guildOnly: true,
	supportGuildOnly: false,
	execute(message, args) {
		if (
			db.get(`${message.guild.id}.allquote`) ||
			message.member.hasPermission("MANAGE_GUILD")
		) {
			const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];
			if (
				serverQuotes.length >=
				(db.get(`${message.guild.id}.maxQuotes`) || 30)
			) {
				const fullQuotesEmbed = new Discord.MessageEmbed()
					.setTitle("❌ Storage full")
					.setColor(config.colors.error)
					.setDescription(
						`This server has too many quotes! Remove some with \`${message.applicablePrefix}deletequote\` before adding more.`
					);
				return message.channel.send(fullQuotesEmbed);
			}

			message.channel.messages
				.fetch({
					limit: 1,
					before: message.id,
					force: true,
				})
				.then((messages) => {
					const quoteMessage = messages.first() || messages;

					if (
						quoteMessage.content.startsWith(
							message.applicablePrefix
						) ||
						quoteMessage.author.id === message.client.user.id
					) {
						const cannotQuoteEmbed = new Discord.MessageEmbed()
							.setTitle("❌ Cannot quote message")
							.setColor(config.colors.error)
							.setDescription(
								"Messages that start with the prefix or are from me cannot be quoted."
							);
						return message.channel.send(cannotQuoteEmbed);
					}

					const quoteAuthor = quoteMessage.author.tag;
					const quoteText = quoteMessage.content;

					if (
						quoteText.length >
						(db.get(`${message.guild.id}.maxQuoteSize`) || 130)
					) {
						const quoteSizeEmbed = new Discord.MessageEmbed()
							.setTitle("❌ Quote too big")
							.setColor(config.colors.error)
							.setDescription(
								`Quotes cannot be longer than ${
									db.get(
										`${message.guild.id}.maxQuoteSize`
									) || 130
								} characters.`
							);
						return message.channel.send(quoteSizeEmbed);
					}

					db.push(`${message.guild.id}.quotes`, {
						text: quoteText,
						author: quoteAuthor,
						createdTimestamp: Date.now(),
						quoteTimestamp: quoteMessage.createdTimestamp,
						quoter: message.author.id,
					});

					const successEmbed = new Discord.MessageEmbed()
						.setTitle("✅ Added quote")
						.setColor(config.colors.success)
						.setDescription(
							`Created a new server quote:
							
							"${quoteText}" - ${quoteAuthor}`
						)
						.setFooter(`Quote #${(serverQuotes.length || 0) + 1}`);
					return message.channel.send(successEmbed);
				})
				.catch((error) => {
					console.error(`Failed to fetch message in channel #${message.channel.name} (${message.channel.id}) in guild ${message.guild.name} (${message.guild.id})
					* ${error}`);

					const errorEmbed = new Discord.MessageEmbed()
						.setTitle("❌ An error occured")
						.setColor(config.colors.error)
						.setDescription(
							"Failed to fetch the most recent message."
						);
					return message.channel.send(errorEmbed);
				});
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					`That action requires the Manage Guild permission.
					
					**❗ To allow anyone to create quotes**, have an administrator run \`${message.applicablePrefix}allquote\``
				);
			message.channel.send(noPermissionEmbed);
		}
	},
};
