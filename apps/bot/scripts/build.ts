import { mkdir } from "node:fs/promises";
import path from "node:path";

const target = (process.env["BUILD_TARGET"] ??
  "bun-linux-x64") as Bun.Build.CompileTarget;
const buildSha = process.env["BUILD_SHA"] ?? "development";
// https://bun.com/docs/bundler/executables#profile-guided-bytecode-layout
const bytecodeOrder = process.env["BYTECODE_ORDER"]?.split(",");
const outputDirectory = path.resolve("dist");
const outfile = path.resolve(outputDirectory, "quoter-linux-x64");
const assetsDirectory = path.resolve("src/assets");
const migrationsDirectory = path.resolve("drizzle");

await mkdir(outputDirectory, { recursive: true });

const result = await Bun.build({
  bytecode: true,
  compile: {
    assets: [assetsDirectory, migrationsDirectory],
    bytecodeOrder,
    outfile,
    target,
  },
  define: {
    "process.env.BUILD_SHA": JSON.stringify(buildSha),
  },
  entrypoints: [path.resolve("src/main.ts")],
  format: "esm",
  minify: true,
  sourcemap: "linked",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log(
  `Built ${outfile} for ${target} at ${buildSha}${bytecodeOrder ? ` with bytecode order from ${bytecodeOrder.join(", ")}` : ""}`
);
