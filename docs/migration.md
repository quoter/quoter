# MongoDB to SQLite migration

The migration is an offline, one-time production operation. It keeps each
existing quote's current one-based array position as its stable quote number.
New quote numbers continue after the highest migrated number.

## Test the source

Run a dry run while the current bot can remain online:

```bash
bun run --cwd apps/bot migrate:mongo -- \
  --mongo-uri "$MONGO_URI" \
  --sqlite /var/tmp/quoter-dry-run.sqlite \
  --report /var/tmp/quoter-dry-run.json \
  --dry-run
```

The report includes totals and per-guild counts. It does not include quote text
or the MongoDB URI. Fix every validation error before the maintenance window.

## Production cutover

1. Announce a short maintenance window.
2. Stop the PM2 bot so MongoDB stops changing.
3. Create a final `mongodump` and upload it to Backblaze B2.
4. Run the migration into a new path. The command refuses an existing file.

```bash
bun run --cwd apps/bot migrate:mongo -- \
  --mongo-uri "$MONGO_URI" \
  --sqlite /var/tmp/quoter.sqlite \
  --report /var/tmp/quoter-migration.json
```

5. Compare the report with MongoDB totals and per-guild counts.
6. Inspect selected guilds, Unicode text, optional fields, and stable numbers.
7. Stop `quoter.service` if it is running. Install the database:

```bash
sudo install -o quoter -g quoter -m 0640 \
  /var/tmp/quoter.sqlite /var/lib/quoter/quoter.sqlite
```

8. Install the versioned release and start `quoter.service`.
9. Review `journalctl -u quoter.service`, Discord readiness, and representative
   create, fetch, search, edit, delete, import, and export commands.
10. Keep MongoDB and its final dump unchanged through the rollback window.

## Rollback

Stop `quoter.service`. Preserve `/var/lib/quoter/quoter.sqlite` for diagnosis.
Start the old PM2 process with its prior MongoDB configuration. Confirm Discord
readiness and representative read and write commands.

The included tests validate the migration against local sanitized fixtures.
Production execution needs access to the VPS, MongoDB, B2, and Discord.
