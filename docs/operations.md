# Operations

## Service state

```bash
systemctl status quoter.service
journalctl -u quoter.service --since today
systemctl list-timers 'quoter-*'
```

The service runs as the `quoter` system user. systemd restarts it after a
failure. A repeated crash reaches the unit start limit and remains visible as a
failed unit. Inspect the exception and database integrity before restarting it.

The application logs process-level exceptions, Discord client errors, startup
migrations, cleanup counts, and shutdown events. It does not log quote text.

## Safe restart

```bash
sudo systemctl restart quoter.service
systemctl is-active quoter.service
```

SIGTERM starts a graceful shutdown. The bot stops its cleanup timer, destroys
the Discord client, and closes SQLite.

## Health check

The release executable has a credential-free startup check. It opens the
configured database, applies migrations, verifies integrity, and exits before a
Discord connection:

```bash
sudo -u quoter env \
  DISCORD_TOKEN=health-check \
  DATABASE_PATH=/var/lib/quoter/quoter.sqlite \
  /opt/quoter/current/quoter-linux-x64 --check
```

Run `sudo scripts/server/verify-vps.sh` from a repository checkout for a wider
host report. Review SSH settings, firewall rules, listening ports, failed units,
timers, updates, disk space, and Quoter file ownership.

## Retention

The bot records when it last sees each guild. It marks confirmed guild leaves
without deleting data at once. Startup and daily cleanup delete guilds last seen
more than 30 days ago. Foreign keys delete their quotes in the same operation.

## Incident checks

For a crash loop, collect these items before changing the host:

```bash
journalctl -u quoter.service -n 200 --no-pager
systemctl show quoter.service -p Result -p NRestarts
sqlite3 /var/lib/quoter/quoter.sqlite 'PRAGMA integrity_check;'
df -h /var/lib/quoter
```

Restore the previous release by changing `/opt/quoter/current` to a retained
release directory, then restart the service. Use the database restore procedure
only when the database itself needs recovery.
