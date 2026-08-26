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

Copy `apps/bot/.env.EXAMPLE` to `apps/bot/.env`. Every change needs a process
restart. Integer values must be positive whole numbers.

| Variable | Type and default | Sensitive | Purpose |
| --- | --- | --- | --- |
| `DISCORD_TOKEN` | Required string | Yes | Discord bot token |
| `DISCORD_ADMIN_ID` | String, empty | No | Space-separated administrator user IDs |
| `DISCORD_GUILD_ID` | Optional string | No | Development command guild |
| `DATABASE_PATH` | Path, `./db/quoter.sqlite` | No | SQLite database file |
| `MAX_GUILD_QUOTES` | Integer, `500` | No | Default quote limit per guild |
| `MAX_QUOTE_LENGTH` | Integer, `250` | No | Default quote text limit |
| `GUILD_RETENTION_DAYS` | Integer, `30` | No | Guild inactivity retention |
| `BUILD_SHA` | String, `development` | No | Source revision shown in logs and `/about` |

Production also uses updater and backup variables. Changes take effect on the
next timer run, or after the related oneshot service is started manually.

| Variable | Type and default | Sensitive | Purpose |
| --- | --- | --- | --- |
| `B2_APPLICATION_KEY_ID` | Required string | Yes | Backblaze application key ID |
| `B2_APPLICATION_KEY` | Required string | Yes | Backblaze application key |
| `B2_BUCKET` | Required string | No | Private backup bucket |
| `B2_PREFIX` | String, `quoter` | No | Backup object prefix |
| `QUOTER_DATABASE_PATH` | Path, `/var/lib/quoter/quoter.sqlite` | No | Backup and restore database |
| `QUOTER_BACKUP_ROOT` | Path, `/var/backups/quoter` | No | Local backup directory |
| `QUOTER_GITHUB_REPOSITORY` | String, `quoter/quoter` | No | Public release repository |
| `QUOTER_INSTALL_ROOT` | Path, `/opt/quoter` | No | Versioned release root |
| `QUOTER_SERVICE_NAME` | String, `quoter.service` | No | Managed systemd unit |

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
