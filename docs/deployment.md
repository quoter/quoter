# Releases and deployment

Production deploys only stable, versioned GitHub Releases.

## Create a release

1. Choose the next Semantic Versioning number.
2. Move the relevant entries from `Unreleased` in `CHANGELOG.md` into a section
   named for that version and date.
3. Update `apps/bot/package.json` to the same version.
4. Open a pull request and wait for CI.
5. Merge the reviewed change to `main`.

The release workflow reads the package version. It skips a version that already
has a Git tag. For a new version it runs all checks, builds the Linux amd64
executable, runs its startup check, creates a SHA-256 checksum, and publishes a
GitHub Release named `v<version>`.

Normal commits to `main` run CI and create a seven-day snapshot artifact. They
do not create a stable release. Production ignores these artifacts.

## Pull-based deployment

`quoter-update.timer` checks GitHub every five minutes. The updater:

1. Reads the latest stable GitHub Release.
2. Exits when that version is already active.
3. Downloads the executable and checksum.
4. Verifies SHA-256 before installation.
5. Starts a SQLite backup when the current service is active.
6. Installs the release under `/opt/quoter/releases/<version>`.
7. Atomically changes `/opt/quoter/current` and restarts the service.
8. Requires five consecutive active health checks.
9. Restores the prior symlink when the new process fails.

The server keeps the three newest release directories. Check deployment state:

```bash
systemctl status quoter.service quoter-update.timer
journalctl -u quoter-update.service --since today
readlink -f /opt/quoter/current
```

Run an immediate update check with:

```bash
sudo systemctl start quoter-update.service
```

This repository prepares and tests the build logic. A production release and
deployment require GitHub and VPS access.
