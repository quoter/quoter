import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires indexed environment access.
const target = (process.env["BUILD_TARGET"] ??
	"bun-linux-x64") as Bun.Build.CompileTarget;
// biome-ignore lint/complexity/useLiteralKeys: TypeScript requires indexed environment access.
const buildSha = process.env["BUILD_SHA"] ?? "development";
const outputDirectory = resolve("dist");
const outputPath = resolve(outputDirectory, "quoter-linux-x64");

await mkdir(outputDirectory, { recursive: true });

const result = await Bun.build({
	entrypoints: [resolve("src/main.ts")],
	compile: {
		target,
		outfile: outputPath,
		assets: [resolve("src/assets"), resolve("drizzle")],
		autoloadDotenv: false,
		autoloadBunfig: false,
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
