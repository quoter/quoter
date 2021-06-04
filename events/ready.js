const mongoose = require("mongoose");
const Guild = require("../schemas/guild.js");
const { mongoPath } = require("../config.json");

module.exports = {
	name: "ready",
	once: true,
	async execute(client) {
		console.log(`Logged in as ${client.user.tag} (${client.user.id})`);

		await mongoose.connect(mongoPath, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true,
		});

		console.log("Connected to mongoDB");

		const currentGuilds = client.guilds.cache.map((g) => g.id);

		if (currentGuilds.size <= 0) {
			return console.warn(
				"An error occurred while retrieving guild cache, or this bot isn't in any guilds. Data deletion will be skipped."
			);
		}

		const response = await Guild.deleteMany({
			_id: { $nin: currentGuilds },
		});
		console.log(`Deleted ${response.deletedCount} guilds from mongoDB`);
	},
};
