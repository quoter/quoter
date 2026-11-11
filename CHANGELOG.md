# Changelog

## 6.0.0

### Breaking Changes

- Slash Commands are registered automatically when Quoter starts, replacing the `deploy-commands` script
- Quote length can no longer be changed per guild. Instead, the `MAX_QUOTE_LENGTH` environment variable applies to every guild
- Removed the PM2 `ecosystem.config.js` file

#### Data is stored in SQLite instead of MongoDB

The `MONGO_URI` environment variable has been replaced with `DATABASE_PATH`, which defaults to `./db/quoter.sqlite`. The database is created on first start. To keep existing quotes, export them with `mongoexport` and convert them with `apps/bot/scripts/migrate-mongo.ts`, following the instructions at the top of that script.

### Features

- Quote numbers no longer change when another quote is deleted
- Quotes are kept for 30 days after Quoter is removed from a server, so that adding the bot back restores them
- Raised the default quote limit from 100 to 2,500 per server
- `/export` includes each quote's number
- Releases include a prebuilt Linux executable

### Fixes

- `/bugs` links to the current GitHub repository

## 5.2.1

- Previous release. See the Git history for older changes.
