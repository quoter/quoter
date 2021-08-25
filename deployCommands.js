const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { token } = require("./config.json");
const fs = require("fs");

const commands = [];
const commandFiles = fs
	.readdirSync("./commands")
	.filter((file) => file.endsWith(".js"));

const [, , clientId, guildId] = process.argv;

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	if (command.hidden) continue;
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
	try {
		console.log("Started refreshing application (/) commands.");

		if (guildId) {
			await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: commands,
			});
		} else {
			await rest.put(Routes.applicationCommands(clientId), {
				body: commands,
			});
		}

		console.log("Successfully reloaded application (/) commands.");
	} catch (error) {
		console.error(error);
	}
})();
