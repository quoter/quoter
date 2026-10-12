import { readFile } from "node:fs/promises";

import quoterPackage from "../package.json";

const changelog = await readFile("../../CHANGELOG.md", "utf-8");

const heading = /^## (?!Unreleased\b)\[?(?<version>[^\]\s]+)\]?.*$/mu.exec(
  changelog
);
const version = heading?.groups?.["version"];
if (!heading || version !== quoterPackage.version) {
  throw new Error(
    `CHANGELOG.md's newest version is ${version ?? "missing"}, but package.json is ${quoterPackage.version}`
  );
}

const sectionStart = heading.index + heading[0].length;
const nextHeading = changelog.slice(sectionStart).search(/^## /mu);
const section = changelog.slice(
  sectionStart,
  nextHeading >= 0 ? sectionStart + nextHeading : undefined
);

if (!section.trim()) {
  throw new Error(`CHANGELOG.md has no notes for ${version}`);
}

process.stdout.write(section.trim());
