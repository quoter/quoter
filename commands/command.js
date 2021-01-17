// This is an EXAMPLE COMMAND, it's disabled for a reason!

const Discord = require("discord.js");
const db = require("quick.db");

const config = require("../config.json");

module.exports = {
	enabled: false,
	hidden: false,
	name: "command",
	description: "Command Description",
	usage: "",
	example: "",
	aliases: [],
	cooldown: 3,
	args: false,
	guildOnly: false,
	supportGuildOnly: false,
	execute(message, args) {
		// Code here
	},
};
