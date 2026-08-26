# Backup and restore

`quoter-backup.timer` runs once per day with a randomized delay. The backup job
uses SQLite's online backup command, checks the copy with `PRAGMA integrity_check`,
adds release and schema metadata, creates a checksum, and uploads both files to
Backblaze B2. Local copies older than seven days are removed. Configure the B2
bucket lifecycle for 30-day retention.

The `quoter-backup` user can read the database and write only the backup path.
B2 credentials are stored in `/etc/quoter/backup.env` with mode `0640`.

## Test a backup

```bash
sudo systemctl start quoter-backup.service
systemctl status quoter-backup.service
journalctl -u quoter-backup.service --since today
ls -lh /var/backups/quoter
```

Confirm that the archive and checksum also exist in B2. Perform a restore drill
after setup and at regular intervals.

## Restore a local archive

Download both files from B2 when the local archive is unavailable. Verify the
checksum first:

```bash
sha256sum --check quoter-YYYY-MM-DDTHH-MM-SSZ.tar.gz.sha256
```

Run the restore helper as root:

```bash
sudo /usr/local/libexec/quoter/restore-quoter.sh \
  /var/backups/quoter/quoter-YYYY-MM-DDTHH-MM-SSZ.tar.gz
```

The helper checks the snapshot, stops the service, creates an emergency copy of
the current database, installs the restored file, and starts the service. Review
the journal and representative Discord commands after the restore.

Backups and restores need live B2 credentials and production storage. The
scripts can receive alternate paths through their documented environment values
for a local drill.
