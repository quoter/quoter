import {
	REST,
	type RESTPostAPIApplicationCommandsJSONBody,
	Routes,
} from "discord.js";
import { commands } from "@/commands";

// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires indexed environment access.
const token = process.env["DISCORD_TOKEN"];
if (!token) {
	throw new Error("DISCORD_TOKEN environment variable not set");
}

const tokenId = token.split(".")[0];
if (!tokenId) throw new Error("DISCORD_TOKEN has an invalid format");
const clientId = Buffer.from(tokenId, "base64").toString();
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
const rest = new REST().setToken(token);

try {
	if (isGuild) {
		// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires indexed environment access.
		const guildId = process.env["DISCORD_GUILD_ID"];
		if (!guildId) {
			throw new Error("DISCORD_GUILD_ID environment variable not set");
		}

		console.log(
			isUndeploy ? "Undeploying" : "Deploying",
			"commands to guild",
			guildId,
		);

		await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
			body: commandsToDeploy,
		});
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
