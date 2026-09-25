import { readFile } from "node:fs/promises";

const version = process.argv[2];
if (!version) throw new Error("Provide a version");

const changelog = await readFile("../../CHANGELOG.md", "utf8");
const escapedVersion = version.replaceAll(".", "\\.");
const heading = new RegExp(
	`^## \\[?${escapedVersion}\\]?(?: - [^\\n]+)?$`,
	"m",
);
const headingMatch = heading.exec(changelog);
const sectionStart = headingMatch
	? headingMatch.index + headingMatch[0].length
	: -1;
const nextHeading =
	sectionStart >= 0 ? changelog.slice(sectionStart).search(/^## /m) : -1;
const section =
	sectionStart >= 0
		? changelog.slice(
				sectionStart,
				nextHeading >= 0 ? sectionStart + nextHeading : undefined,
			)
		: undefined;

if (!section?.trim()) {
	throw new Error(`CHANGELOG.md has no section for ${version}`);
}

process.stdout.write(section.trim());
