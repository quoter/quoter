# Ubuntu VPS setup

The scripts target Ubuntu 24.04 LTS on amd64. They prepare the host for Quoter
and leave normal system facilities available for future services. Quoter uses
dedicated users, directories, systemd units, and a narrow firewall rule.

Keep the Bloom Host recovery console available during SSH changes.

## Base setup

From the repository checkout on the server, run as root:

```bash
ADMIN_USER=nick \
SSH_PUBLIC_KEY='ssh-ed25519 ...' \
bash scripts/server/setup-vps.sh
```

The script installs required packages, the Backblaze B2 CLI, SQLite, UFW, and
unattended security updates. It creates an administrator account, the `quoter`
service user, and a separate backup user. It disables SSH passwords and opens
only OpenSSH in UFW.

Keep the root session open. Connect in a second session with the administrator
key and confirm `sudo` works. Then disable direct root SSH login:

```bash
sudo bash scripts/server/finalize-ssh.sh
```

## Install Quoter units

```bash
sudo bash scripts/server/install-server-files.sh
sudoedit /etc/quoter/quoter.env
sudoedit /etc/quoter/backup.env
```

Set the Discord token, database path, limits, B2 application key, bucket, and
prefix. Keep the default updater settings for `quoter/quoter`.

For a new installation, publish a versioned release and run:

```bash
sudo systemctl start quoter-update.service
sudo systemctl enable --now quoter-update.timer quoter-backup.timer
```

For an existing MongoDB installation, complete the maintenance procedure in
`docs/migration.md` before starting the new bot.

## Verify the host

```bash
sudo bash scripts/server/verify-vps.sh
sudo systemctl start quoter-backup.service
systemctl status quoter.service quoter-update.timer quoter-backup.timer
```

Check B2 for the test backup. Run a restore drill. Confirm unattended upgrades,
time synchronization, disk capacity, and access through the recovery console.

Automatic security updates do not reboot the VPS. Check for
`/var/run/reboot-required` after updates and schedule a reboot when it exists.
Confirm Quoter and its timers after the host returns. journald keeps at most
500 MB of persistent logs, 100 MB of runtime logs, and one month of history.

The repository cannot apply these steps to production without VPS, Discord,
GitHub, MongoDB, and Backblaze access.

## Future services

The host setup does not reserve the VPS for Quoter. Add each future service with
its own Unix user, data directory, systemd unit, firewall rules, and backups.
Docker can be added when a future service benefits from container packaging.
Quoter can continue to run directly under systemd.
