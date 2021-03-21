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
	name: "editquote",
	description: "Edits the specified quote",
	usage: "[id] [quote] [author]",
	example: "",
	aliases: ["equote", "quoteedit"],
	cooldown: 10,
	args: true,
	guildOnly: true,
	supportGuildOnly: false,
	async execute(message, args) {
		if (
			message.member.hasPermission("MANAGE_GUILD") ||
			message.client.admins.get(message.author.id)
		) {
			if (args.length < 2) {
				const invalidArgsEmbed = new Discord.MessageEmbed()
					.setTitle("❌ Incorrect usage")
					.setColor(config.colors.error)
					.setDescription(
						"You have to specify a quote's ID & it's new text."
					);
				return await message.channel.send(invalidArgsEmbed);
			}

			const quoteID = args.shift();

			const serverQuotes = db.get(`${message.guild.id}.quotes`) || [];
			const quote = serverQuotes[quoteID - 1];

			if (!quote) {
				const quoteNotFoundEmbed = new Discord.MessageEmbed()
					.setTitle("❌ No quote found")
					.setColor(config.colors.error)
					.setDescription("Couldn't find a quote with that ID.");
				return await message.channel.send(quoteNotFoundEmbed);
			}

			const quoteArgs = args.join(" ").split("-");
			let editedAuthor;

			if (quoteArgs.length > 1) {
				editedAuthor = await mentionParse(
					quoteArgs.pop(),
					message.client
				);
			}

			if (
				editedAuthor &&
				(editedAuthor.trim().toLowerCase() === "anon" ||
					editedAuthor.trim().toLowerCase() === "anonymous")
			) {
				editedAuthor = undefined;
			}

			const editedText = quoteArgs.join("-").trim();

			if (
				editedText.length >
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

			serverQuotes[quoteID - 1] = {
				text: editedText,
				author: editedAuthor,
				createdTimestamp: quote.createdTimestamp,
				editedTimestamp: Date.now(),
				quoter: quote.quoter,
				editor: message.author.id,
			};

			db.set(`${message.guild.id}.quotes`, serverQuotes);

			const successEmbed = new Discord.MessageEmbed()
				.setTitle("✅ Edited quote")
				.setColor(config.colors.success)
				.setDescription(
					`"${editedText}"${editedAuthor ? ` - ${editedAuthor}` : ""}`
				)
				.setFooter(`Quote #${quoteID}`);
			await message.channel.send(successEmbed);
		} else {
			const noPermissionEmbed = new Discord.MessageEmbed()
				.setTitle("❌ You don't have permission to do that")
				.setColor(config.colors.error)
				.setDescription(
					`That action requires the Manage Guild permission.`
				);
			await message.channel.send(noPermissionEmbed);
		}
	},
};
