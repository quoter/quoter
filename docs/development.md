# Development

## Requirements

- Bun 1.4
- A Discord application for live development

Install the exact dependencies from the root lockfile:

```bash
bun install --frozen-lockfile
```

The workspace contains only `apps/bot` today. Add a future website as
`apps/web`. A task runner such as Turborepo is not needed at this size.

## Configuration

Copy `apps/bot/.env.EXAMPLE` to `apps/bot/.env`. The bot reads these values:

- `DISCORD_TOKEN`: required bot token.
- `DISCORD_ADMIN_ID`: optional space-separated Discord user IDs.
- `DISCORD_GUILD_ID`: optional development guild for command deployment.
- `DATABASE_PATH`: SQLite path. The default is `./db/quoter.sqlite`.
- `MAX_GUILD_QUOTES`: default quote limit for a guild.
- `MAX_QUOTE_LENGTH`: default quote text limit.
- `GUILD_RETENTION_DAYS`: days to retain a guild after it was last seen.

## Commands

```bash
bun run start
bun run deploy-commands --guild
bun run lint
bun run typecheck
bun run test
bun run build
bun run check
```

`bun run check` runs formatting and lint checks, TypeScript, tests, and the Bun
bundle build. Tests create isolated SQLite databases and do not contact Discord.

Generate a Drizzle migration after a schema change:

```bash
bun run --cwd apps/bot db:generate
```

Review the generated SQL before committing it. Startup applies pending
migrations before the Discord client logs in.

## Release build

Build the Linux amd64 executable from any supported development host:

```bash
BUILD_SHA=$(git rev-parse HEAD) bun run build:release
```

The output is `apps/bot/dist/quoter-linux-x64`. The executable embeds the bot
assets and database migrations. CI runs its `--check` mode on Ubuntu.

Live Discord testing needs a bot token and a test guild. Those credentials are
not part of the automated test suite.
