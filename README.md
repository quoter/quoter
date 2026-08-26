<div align="center">
	<h1><a href="https://quoter.cc">Quoter</a></h1>
	Quoter is a Discord quote book. Save messages, manage quotes, search the
	collection, get a random quote, or turn one into an image.
</div>

## Repository

Quoter is a Bun workspace monorepo. The Discord bot is in `apps/bot`. A website
can be added later as `apps/web` without changing the bot workspace.

The bot uses TypeScript, discord.js, Drizzle ORM, and a local SQLite database.
Quote numbers are stable within each guild. Deleting a quote never renumbers the
remaining quotes.

## Development

Install Bun 1.4, then install dependencies and run the checks:

```bash
bun install --frozen-lockfile
bun run check
```

Copy `apps/bot/.env.EXAMPLE` to `apps/bot/.env` and add a Discord bot token.
Start the bot from the repository root:

```bash
bun run start
```

Deploy commands to a test guild with `DISCORD_GUILD_ID` set:

```bash
bun run deploy-commands --guild
```

See [development.md](docs/development.md) for the full local workflow.

## Production

Production runs a compiled Linux amd64 executable under systemd. The server
polls stable GitHub Releases and installs them after checksum and health checks.
See [deployment.md](docs/deployment.md) and [vps-setup.md](docs/vps-setup.md).

Existing MongoDB data can be converted with the offline migration tool. Follow
[migration.md](docs/migration.md) before the first SQLite deployment.

## Initial validation boundary

The repository tests run without Discord, MongoDB, Backblaze B2, or production
credentials. Live Discord checks, the production migration, and the VPS rollout
must be completed with the production credentials and systems. The runbooks list
those steps.

## Contributing

Read the [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. Run
`bun run check` before opening a pull request.

## License

Quoter is licensed under the [GNU Affero General Public License v3.0](LICENSE).
