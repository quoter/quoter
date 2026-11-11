# Self-Hosting Quoter

How to run Quoter on a Linux server (x86-64, with systemd), with scripts for updating, changing quote limits, and daily backups. Commands are for Ubuntu and run as root.

## Setting up Quoter

Create a bot in [Discord's developer portal](https://discord.com/developers/applications), copy its token, and invite it with `https://discord.com/oauth2/authorize?scope=bot&client_id=CLIENT_ID`.

Install the tools the scripts use:

```bash
apt install curl sqlite3 zstd s3cmd
```

Create a user and directory for Quoter:

```bash
useradd --system --no-create-home --shell /usr/sbin/nologin quoter
mkdir /opt/quoter
```

Create `/opt/quoter/quoter.env`, see [`apps/bot/.env.EXAMPLE`](../apps/bot/.env.EXAMPLE).

```bash
DISCORD_TOKEN=your-bot-token
DATABASE_PATH=/var/lib/quoter/quoter.sqlite
```

Make sure only root can read it because it contains the token:

```bash
chmod 600 /opt/quoter/quoter.env
```

Create `/etc/systemd/system/quoter.service`. It runs Quoter as the `quoter` user, restarts it if it crashes, and creates `/var/lib/quoter`:

```ini
[Unit]
Description=Quoter
Wants=network-online.target
After=network-online.target

[Service]
User=quoter
Group=quoter
EnvironmentFile=/opt/quoter/quoter.env
ExecStart=/opt/quoter/quoter
StateDirectory=quoter
WorkingDirectory=/var/lib/quoter
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable quoter
```

Then install Quoter with the update script below.

## Updating

Save this as `/opt/quoter/update.sh` and `chmod 700` it. It downloads the latest [release](https://github.com/quoter/quoter/releases) if it's different from the installed one, verifies it, makes sure it runs, then swaps it in and restarts Quoter. Run it to install Quoter for the first time, and again whenever there's a new release.

```bash
#!/bin/bash
# Installs the latest Quoter release if it's different from the installed one.
set -euo pipefail

INSTALL_DIR=/opt/quoter
RELEASE_URL=https://github.com/quoter/quoter/releases/latest/download
ASSET=quoter-linux-x64

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
cd "$WORK_DIR"

curl -fsSL -o "$ASSET.sha256" "$RELEASE_URL/$ASSET.sha256"
latest=$(cut -d ' ' -f 1 "$ASSET.sha256")
installed=$(sha256sum "$INSTALL_DIR/quoter" 2>/dev/null | cut -d ' ' -f 1 || true)
if [[ $latest == "$installed" ]]; then
  echo "Quoter is up to date"
  exit 0
fi

curl -fsSL -o "$ASSET" "$RELEASE_URL/$ASSET"
sha256sum --check --quiet "$ASSET.sha256"
chmod +x "$ASSET"

# make sure it runs on this server, without connecting to Discord
DISCORD_TOKEN=check DATABASE_PATH="$WORK_DIR/check.sqlite" "./$ASSET" --check

# keep the previous version, in case you need to go back to it
if [[ -f $INSTALL_DIR/quoter ]]; then
  cp "$INSTALL_DIR/quoter" "$INSTALL_DIR/quoter.previous"
fi
install -m 755 "$ASSET" "$INSTALL_DIR/quoter.new"
mv -f "$INSTALL_DIR/quoter.new" "$INSTALL_DIR/quoter"

systemctl restart quoter
echo "Installed $latest"
```

Check the [changelog](../CHANGELOG.md) before updating to a new major version. Quoter updates its database on startup, so going back to `quoter.previous` may also mean restoring a backup from before the update.

## Viewing logs

```bash
journalctl -u quoter -f               # follow live
journalctl -u quoter --grep -i error  # errors, with their stack traces
systemctl status quoter               # whether it's running, and the latest lines
```

## Changing a server's quote limit

Servers can have up to `MAX_GUILD_QUOTES` quotes (2,500 by default). Save this as `/usr/local/bin/quoter-limit` and `chmod 700` it to change that per server. Changes apply immediately, and it's safe to run while Quoter is running.

```bash
#!/bin/bash
# Shows or changes a server's quote limit.
#
#   quoter-limit <server-id>            show the limit and number of quotes
#   quoter-limit <server-id> <limit>    set the limit
#   quoter-limit <server-id> default    go back to MAX_GUILD_QUOTES
set -euo pipefail

DATABASE=/var/lib/quoter/quoter.sqlite

guild=${1:-}
limit=${2:-}
if [[ ! $guild =~ ^[0-9]+$ ]]; then
  echo "Usage: quoter-limit <server-id> [<limit> | default]" >&2
  exit 1
fi

# run as the quoter user, so the database's files stay owned by it
query() {
  runuser -u quoter -- sqlite3 -bail "$DATABASE" "$@"
}

if [[ -n $limit ]]; then
  if [[ $limit == default ]]; then
    value=NULL
  elif [[ $limit =~ ^[0-9]+$ ]]; then
    value=$limit
  else
    echo "The limit must be a number or \"default\"" >&2
    exit 1
  fi
  changed=$(query "UPDATE guilds SET max_quotes = $value WHERE guild_id = '$guild'; SELECT changes();")
  if [[ $changed != 1 ]]; then
    echo "Quoter isn't in that server" >&2
    exit 1
  fi
fi

query -header -column "
  SELECT
    guild_id AS server,
    coalesce(max_quotes, 'default') AS quote_limit,
    (SELECT count(*) FROM quotes WHERE guild_id = '$guild') AS quotes
  FROM guilds
  WHERE guild_id = '$guild';"
```

## Backups

This script snapshots the database with `VACUUM INTO`, checks it, compresses it, and uploads it to S3-compatible storage with `s3cmd`. Run `s3cmd --configure` first. Don't back up by copying `quoter.sqlite` while Quoter is running, since recent changes may only be in `quoter.sqlite-wal`.

Save it as `/opt/quoter/backup.sh`, set `BUCKET`, and `chmod 700` it:

```bash
#!/bin/bash
# Backs up Quoter's database to S3-compatible storage.
set -euo pipefail

DATABASE=/var/lib/quoter/quoter.sqlite
BUCKET=s3://your-bucket/quoter/

WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT
chown quoter "$WORK_DIR"
BACKUP="$WORK_DIR/quoter-$(date -u +%Y-%m-%d_%H-%M-%S).sqlite"

runuser -u quoter -- sqlite3 -bail "$DATABASE" "VACUUM INTO '$BACKUP'"

result=$(sqlite3 "$BACKUP" "PRAGMA integrity_check")
if [[ $result != ok ]]; then
  echo "Backup failed its integrity check: $result" >&2
  exit 1
fi

zstd -q -19 --rm "$BACKUP"
s3cmd put "$BACKUP.zst" "$BUCKET"
echo "Uploaded $(basename "$BACKUP").zst"
```

To run it daily, create `/etc/systemd/system/quoter-backup.service`. The `ExecStopPost` line is optional, and reports each run's result to [Healthchecks.io](https://healthchecks.io).

```ini
[Unit]
Description=Back up Quoter
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/opt/quoter/backup.sh
ExecStopPost=/bin/sh -c 'curl -fsS -m 10 --retry 5 https://hc-ping.com/your-check-id/$EXIT_STATUS'
```

And `/etc/systemd/system/quoter-backup.timer`:

```ini
[Unit]
Description=Back up Quoter daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
systemctl daemon-reload
systemctl enable --now quoter-backup.timer
```

The script never deletes old backups, so add a lifecycle rule to the bucket.

### Restoring

```bash
zstd -d quoter-2026-01-01_00-00-00.sqlite.zst -o quoter.sqlite
systemctl stop quoter
rm -f /var/lib/quoter/quoter.sqlite-wal /var/lib/quoter/quoter.sqlite-shm
install -o quoter -g quoter -m 600 quoter.sqlite /var/lib/quoter/quoter.sqlite
systemctl start quoter
```

The `-wal` and `-shm` files belong to the database being replaced, so remove them.
