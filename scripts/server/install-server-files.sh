#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

readonly source_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

install --directory --owner=root --group=root --mode=0755 \
  /usr/local/libexec/quoter
install --owner=root --group=root --mode=0755 \
  "${source_dir}/update-quoter.sh" /usr/local/libexec/quoter/update-quoter.sh
install --owner=root --group=root --mode=0755 \
  "${source_dir}/backup-quoter.sh" /usr/local/libexec/quoter/backup-quoter.sh
install --owner=root --group=root --mode=0755 \
  "${source_dir}/restore-quoter.sh" /usr/local/libexec/quoter/restore-quoter.sh

for unit in quoter.service quoter-update.service quoter-update.timer \
  quoter-backup.service quoter-backup.timer; do
  install --owner=root --group=root --mode=0644 \
    "${source_dir}/${unit}" "/etc/systemd/system/${unit}"
done

if [[ ! -f /etc/quoter/quoter.env ]]; then
  install --owner=root --group=quoter --mode=0640 \
    "${source_dir}/quoter.env.example" /etc/quoter/quoter.env
fi
if [[ ! -f /etc/quoter/backup.env ]]; then
  install --owner=root --group=quoter-backup --mode=0640 \
    "${source_dir}/backup.env.example" /etc/quoter/backup.env
fi
if [[ ! -f /etc/quoter/updater.env ]]; then
  install --owner=root --group=root --mode=0644 \
    "${source_dir}/updater.env.example" /etc/quoter/updater.env
fi

systemctl daemon-reload
systemctl enable quoter.service quoter-update.timer quoter-backup.timer

echo "Service files installed. Fill in /etc/quoter/*.env before starting timers."
