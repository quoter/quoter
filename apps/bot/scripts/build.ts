import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const target = (process.env["BUILD_TARGET"] ??
	"bun-linux-x64") as Bun.Build.CompileTarget;
const buildSha = process.env["BUILD_SHA"] ?? "development";
const outputDirectory = resolve("dist");
const outputPath = resolve(outputDirectory, "quoter-linux-x64");
const assetsDirectory = resolve("src/assets");
const migrationsDirectory = resolve("drizzle");

await mkdir(outputDirectory, { recursive: true });

const result = await Bun.build({
	entrypoints: [resolve("src/main.ts")],
	compile: {
		target,
		outfile: outputPath,
		assets: [assetsDirectory, migrationsDirectory],
	},
	define: {
		"process.env.BUILD_SHA": JSON.stringify(buildSha),
	},
	minify: true,
	sourcemap: "linked",
});

if (!result.success) {
	for (const log of result.logs) console.error(log);
	process.exit(1);
}

console.log(`Built ${outputPath} for ${target} at ${buildSha}`);
