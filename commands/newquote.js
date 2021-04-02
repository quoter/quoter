const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

const mentionParse = async (mention, client) => {
	if (mention.startsWith("<@") && mention.endsWith(">")) {
		mention = mention.slice(2, -1);
	}

	if (mention.startsWith("!")) {
		mention = mention.slice(1);
	}

	try {
		const result = await client.users.fetch(mention);
		return result.tag;
	} catch {
		return mention.substr(0, 32);
	}
};

module.exports = {
	enabled: true,
	hidden: false,
	name: "newquote",
	description: "Creates a new quote",
	usage: "<Text> [- <Author>]",
	example: "You're gonna have a bad time - Sans",
	aliases: ["createquote", "addquote", "nquote"],
	cooldown: 10,
	args: true,
	guildOnly: true,
	supportGuildOnly: false,
	async execute(message, args) {
		if (
			db.get(`${message.guild.id}.allquote`) ||
			message.member.hasPermission("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
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
						`This server has too many quotes! Use \`${message.applicablePrefix}deletequote\` before creating more.`
					);
				return await message.channel.send(fullQuotesEmbed);
			}

			const quoteArgs = args.join(" ").split("-");
			let author;

			if (quoteArgs.length > 1) {
				author = await mentionParse(quoteArgs.pop(), message.client);
			}

			if (
				author &&
				(author.trim().toLowerCase() === "anon" ||
					author.trim().toLowerCase() === "anonymous")
			) {
				author = undefined;
			}

			const quote = quoteArgs.join("-").trim();

			if (
				quote.length >
				(db.get(`${message.guild.id}.maxQuoteSize`) || 130)
			) {
				const quoteSizeEmbed = new Discord.MessageEmbed()
					.setTitle("❌ Quote too big")
					.setColor(config.colors.error)
					.setDescription(
						`Quotes cannot be longer than ${
							db.get(`${message.guild.id}.maxQuoteSize`) || 130
						} characters.`
					);
				return await message.channel.send(quoteSizeEmbed);
			}

			db.push(`${message.guild.id}.quotes`, {
				text: quote,
				author: author,
				createdTimestamp: Date.now(),
				quoter: message.author.id,
			});

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Added quote")
				.setColor(config.colors.success)
				.setDescription(
					`Created a new server quote:

"${quote}"${author ? ` - ${author}` : ""}`
				)
				.setFooter(`Quote #${(serverQuotes.length || 0) + 1}`);
			await message.channel.send(successEmbed);
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					`That action requires the Manage Guild permission.

**❗ To allow anyone to create quotes**, use \`${message.applicablePrefix}allquote\`.`
				);
			await message.channel.send(noPermissionEmbed);
		}
	},
};
