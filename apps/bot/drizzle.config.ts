import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: {
		// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires indexed environment access.
		url: process.env["DATABASE_PATH"] ?? "./db/quoter.sqlite",
	},
});
