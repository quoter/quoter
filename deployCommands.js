/*
Copyright (C) 2020-2023 Nick Oates

This file is part of Quoter.

Quoter is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, version 3.

Quoter is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with Quoter.  If not, see <https://www.gnu.org/licenses/>.
*/

const { REST, Routes } = require("discord.js");
const { token, disabledCommands, guildId } = require("./config.json");
const fs = require("fs");

const clientId = Buffer.from(token.split(".")[0], "base64").toString();
const isUndeploy = process.argv.some((x) => x === "--undeploy");
const isGuild = process.argv.some((x) => x === "--guild");
const commands = [];

if (!isUndeploy) {
	const commandFiles = fs
		.readdirSync("./commands")
		.filter((file) => file.endsWith(".js"));

	for (const file of commandFiles) {
		const command = require(`./commands/${file}`);
		if (disabledCommands?.includes(command.data.name)) continue;
		commands.push(command.data.toJSON());
	}
}

const rest = new REST().setToken(token);

(async () => {
	try {
		if (isGuild) {
			console.log(
				isUndeploy ? "Undeploying" : "Deploying",
				"commands to guild",
				guildId,
			);

			await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
				body: commands,
			});
		} else {
			console.log(
				isUndeploy ? "Undeploying" : "Deploying",
				"commands globally",
			);

			await rest.put(Routes.applicationCommands(clientId), {
				body: commands,
			});
		}

		console.log("Done!");
	} catch (error) {
		console.error(error);
	}
})();
