/*
Copyright (C) 2020-2021 Nicholas Christopher
This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, version 3.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>
*/

console.log(`Starting Quoter v${require("./package.json").version}...`);

const { Client, Collection } = require("discord.js");
const db = require("quick.db");
const fs = require("fs");

const config = require("./config.json");

const client = new Client({
	presence: {
		activity: {
			name: `${config.defaultPrefix}help`,
			type: "LISTENING",
		},
	},
	disableMentions: "everyone",
	ws: { intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"] },
});

client.commands = new Collection();
client.admins = new Collection();

const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

const cooldowns = new Collection();

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

	const currentGuilds = client.guilds.cache;

	if (currentGuilds.size <= 0) {
		return console.error(
			"An error occurred while retrieving guild cache, or this bot isn't in any guilds. Data deletion will be skipped to prevent data loss."
		);
	}

	db.all().forEach((dbGuild) => {
		if (
			!currentGuilds.find((cachedGuild) => cachedGuild.id === dbGuild.ID)
		) {
			db.delete(dbGuild.ID);
			console.log(`Deleted data for removed guild ${dbGuild.ID}.`);
		}
	});
});

client.on("message", async (message) => {
	message.applicablePrefix = message.guild
		? db.get(`${message.guild.id}.prefix`) || config.defaultPrefix
		: config.defaultPrefix;

	const prefix = [
		`<@${client.user.id}>`,
		`<@!${client.user.id}>`,
		message.applicablePrefix,
	].find((p) =>
		message.content.trim().toLowerCase().startsWith(p.toLowerCase())
	);

	if (!prefix || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	const command =
		client.commands.get(commandName) ||
		client.commands.find((cmd) => cmd.aliases?.includes(commandName));

	if (!command) return;

	if (
		message.channel
			?.permissionsFor?.(client.user.id)
			?.has?.("EMBED_LINKS") === false
	) {
		try {
			return message.channel.send(
				"❌ **|** Quoter doesn't have permissions to **Embed Links** in this channel."
			);
		} catch (error) {
			console.error(
				`Failed to send message in #${message.channel.name} (${
					message.channel.id
				})${
					message.guild
						? ` of server ${message.guild.name} (${message.guild.id})`
						: ""
				}\n${error}`
			);
		}
	}

	if (!command.enabled) {
		try {
			return message.channel.send(
				`❌ **|** \`${message.applicablePrefix}${command.name}\` is a disabled command.`
			);
		} catch (error) {
			console.error(
				`Failed to send message in #${message.channel.name} (${
					message.channel.id
				})${
					message.guild
						? ` of server ${message.guild.name} (${message.guild.id})`
						: ""
				}\n${error}`
			);
		}
	}

	if (
		command.guildOnly &&
		message.channel.type !== "text" &&
		message.channel.type !== "news"
	) {
		try {
			return message.channel.send(
				`❌ **|** \`${message.applicablePrefix}${command.name}\` can only be used inside servers.`
			);
		} catch (error) {
			console.error(
				`Failed to send message in #${message.channel.name} (${
					message.channel.id
				})${
					message.guild
						? ` of server ${message.guild.name} (${message.guild.id})`
						: ""
				}\n${error}`
			);
		}
	}

	if (command.args && !args.length) {
		try {
			return message.channel.send(
				"❌ **|** You didn't provide any arguments."
			);
		} catch (error) {
			console.error(
				`Failed to send message in #${message.channel.name} (${
					message.channel.id
				})${
					message.guild
						? ` of server ${message.guild.name} (${message.guild.id})`
						: ""
				}\n${error}`
			);
		}
	}

	if (!client.admins.get(message.author.id)) {
		if (!cooldowns.has(command.name)) {
			cooldowns.set(command.name, new Collection());
		}

		const now = Date.now();
		const timestamps = cooldowns.get(command.name);
		const cooldownAmount = (command.cooldown || 3) * 1000;

		if (timestamps.has(message.author.id)) {
			const expirationTime =
				timestamps.get(message.author.id) + cooldownAmount;

			if (now < expirationTime) {
				const timeLeft = (expirationTime - now) / 1000;
				try {
					return message.channel.send(
						`🛑 **|** Wait ${timeLeft.toFixed(
							0
						)} second(s) before using \`${
							message.applicablePrefix
						}${command.name}\` again.`
					);
				} catch (error) {
					console.error(
						`Failed to send message in #${message.channel.name} (${
							message.channel.id
						})${
							message.guild
								? ` of server ${message.guild.name} (${message.guild.id})`
								: ""
						}\n${error}`
					);
				}
			}
		}

		timestamps.set(message.author.id, now);
		setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	}

	try {
		await command.execute(message, args);
	} catch (error) {
		console.error(`Failed to execute command ${command.name} for user ${message.author.tag} (${message.author.id})
		* ${error}`);

		try {
			await message.channel.send(
				`❌ **|** An error occurred. Please report this to Quoter's developers with \`${message.applicablePrefix}bugs\`.`
			);
		} catch (error2) {
			console.error(
				`Failed to send message in #${message.channel.name} (${
					message.channel.id
				})${
					message.guild
						? ` of server ${message.guild.name} (${message.guild.id})`
						: ""
				}\n${error2}`
			);
		}
	}

	if (Math.random() >= 1 - (config.upvoteChance || 3) / 100) {
		try {
			await message.channel.send(
				"💬 **|** If you're enjoying Quoter, consider upvoting it! <https://top.gg/bot/784853298271748136/vote>"
			);
		} catch (error) {
			console.error(
				`Failed to send message in #${message.channel.name} (${
					message.channel.id
				})${
					message.guild
						? ` of server ${message.guild.name} (${message.guild.id})`
						: ""
				}\n${error}`
			);
		}
	}
});

client.on("guildDelete", (guild) => {
	db.delete(guild.id);

	console.log(`Deleted data for guild ${guild.name} (${guild.id})`);
});

client.login(config.token);
