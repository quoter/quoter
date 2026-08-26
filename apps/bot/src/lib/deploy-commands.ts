import {
	REST,
	type RESTPostAPIApplicationCommandsJSONBody,
	Routes,
} from "discord.js";
import { commands } from "@/commands";

if (process.env.DISCORD_TOKEN === undefined) {
	throw new Error("DISCORD_TOKEN environment variable not set");
}

const clientId = Buffer.from(
	process.env.DISCORD_TOKEN.split(".")[0],
	"base64",
).toString();
const isUndeploy = process.argv.some((x) => x === "--undeploy");
const isGuild = process.argv.some((x) => x === "--guild");

const commandsToDeploy: Array<
	RESTPostAPIApplicationCommandsJSONBody | undefined
> = [];

if (!isUndeploy) {
	Object.values(commands).forEach((command) => {
		commandsToDeploy.push(command.data.toJSON());
	});
}
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
	if (isGuild) {
		if (process.env.DISCORD_GUILD_ID === undefined) {
			throw new Error("DISCORD_GUILD_ID environment variable not set");
		}

		console.log(
			isUndeploy ? "Undeploying" : "Deploying",
			"commands to guild",
			process.env.DISCORD_GUILD_ID,
		);

		await rest.put(
			Routes.applicationGuildCommands(clientId, process.env.DISCORD_GUILD_ID),
			{
				body: commandsToDeploy,
			},
		);
	} else {
		console.log(isUndeploy ? "Undeploying" : "Deploying", "commands globally");

		await rest.put(Routes.applicationCommands(clientId), {
			body: commandsToDeploy,
		});
	}

	console.log("Done!");
} catch (error) {
	console.error(error);
}
