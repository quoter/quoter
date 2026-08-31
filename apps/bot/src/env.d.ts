declare namespace NodeJS {
	interface ProcessEnv {
		BUILD_SHA?: string;
		BUILD_TARGET?: string;
		DATABASE_PATH?: string;
		DISCORD_GUILD_ID?: string;
		DISCORD_TOKEN?: string;
		MONGO_URI?: string;
	}
}
