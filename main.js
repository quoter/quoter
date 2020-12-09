const Discord = require("discord.js");
const db = require("quick.db");
const fs = require("fs");

const config = require("./config.json");

const client = new Discord.Client({
	presence: {
		activity: {
			name: `${config.defaultPrefix}help`,
			type: "LISTENING",
		},
	},
});

client.commands = new Discord.Collection();

const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

// Require every .js file in ./commands
// and set it in client.commands
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const cooldowns = new Discord.Collection();

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}`);
});

client.on("message", (message) => {
	message.applicablePrefix = message.guild
		? db.get(`${message.guild.id}.prefix`) || config.defaultPrefix
		: config.defaultPrefix;

	const prefix = [
		`<@${client.user.id}>`,
		`<@!${client.user.id}>`,
		message.applicablePrefix,
	].find((prefix) =>
		message.content.trim().toLowerCase().startsWith(prefix.toLowerCase())
	);

	if (!prefix || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command =
		client.commands.get(commandName) ||
		client.commands.find(
			(command) =>
				command.aliases && command.aliases.includes(commandName)
		);

	if (!command) return console.log("No command found");

	if (!command.enabled) {
		const disabledEmbed = new Discord.MessageEmbed()
			.setTitle("❌ That command is disabled")
			.setColor(config.colors.error)
			.setDescription(
				`\`${message.applicablePrefix}${command.name}\` is disabled! Contact an administrator if this is an error`
			);
		return message.channel.send(disabledEmbed).catch((error) => {
			console.error(`Failed to send message in #${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})
			* ${error}`);
		});
	}

	if (
		command.guildOnly &&
		message.channel.type !== "text" &&
		message.channel.type !== "news"
	) {
		const embed = new Discord.MessageEmbed()
			.setColor(config.colors.error)
			.setTitle("❌ Not here")
			.setDescription(
				`\`${message.applicablePrefix}${command.name}\` can only be used inside servers`
			);
		return message.channel.send(embed).catch((error) => {
			console.error(`Failed to send message in #${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})
				* ${error}`);
		});
	}

	if (
		command.supportGuildOnly &&
		message.guild.id !== config.supportGuildOnly
	) {
		const embed = new Discord.MessageEmbed()
			.setColor(config.colors.error)
			.setTitle("❌ Not here")
			.setDescription(
				`\`${message.applicablePrefix}${command.name}\` can only be used inside the [support server](https://discord.gg/QzXTgS2CNk)`
			);
		return message.channel.send(embed).catch((error) => {
			console.error(`Failed to send message in #${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})
				* ${error}`);
		});
	}

	if (command.args && !args.length) {
		const embed = new Discord.MessageEmbed()
			.setColor(config.colors.error)
			.setTitle("❌ Incorrect Usage")
			.setDescription("You didn't provide any arguments");
		return message.channel.send(embed).catch((error) => {
			console.error(`Failed to send message in #${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})
				* ${error}`);
		});
	}

	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Discord.Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(message.author.id)) {
		const expirationTime =
			timestamps.get(message.author.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			const embed = new Discord.MessageEmbed()
				.setColor(config.colors.error)
				.setTitle("🛑 Slow down")
				.setDescription(
					`Wait ${timeLeft.toFixed(0)} second(s) before using \`${
						message.applicablePrefix
					}${command.name}\` again`
				);
			return message.channel.send(embed).catch((error) => {
				console.error(`Failed to send message in #${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})
					* ${error}`);
			});
		}
	}

	timestamps.set(message.author.id, now);
	setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

	try {
		command.execute(message, args);
	} catch (error) {
		console.error(`Failed to execute command ${command.name} for user ${message.author.tag} (${message.author.id})
		* ${error}`);
		const errorEmbed = new Discord.MessageEmbed()
			.setColor(config.colors.error)
			.setTitle("❌ An error occured")
			.setDescription("Contact an administrator about this issue");
		message.channel.send(errorEmbed).catch((error) => {
			console.error(`Failed to send message in #${channel.name} (${channel.id}) in ${channel.guild.name} (${channel.guild.id})
				* ${error}`);
		});
	}
});

client.login(config.token);
