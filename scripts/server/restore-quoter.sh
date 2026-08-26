#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 /path/to/quoter-backup.tar.gz" >&2
  exit 2
fi

readonly archive="$1"
readonly database_path="${QUOTER_DATABASE_PATH:-/var/lib/quoter/quoter.sqlite}"
readonly service_name="${QUOTER_SERVICE_NAME:-quoter.service}"
readonly database_owner="${QUOTER_DATABASE_OWNER:-quoter:quoter}"

temporary_dir="$(mktemp --directory /var/tmp/quoter-restore.XXXXXX)"
trap 'rm -rf -- "${temporary_dir}"' EXIT

tar --extract --gzip --file "${archive}" --directory "${temporary_dir}"
integrity="$(sqlite3 "${temporary_dir}/quoter.sqlite" 'PRAGMA integrity_check;')"
if [[ "${integrity}" != "ok" ]]; then
  echo "Backup integrity check failed: ${integrity}" >&2
  exit 1
fi

systemctl stop "${service_name}"

if [[ -f "${database_path}" ]]; then
  emergency_backup="${database_path}.before-restore.$(date --utc +%s)"
  sqlite3 "${database_path}" ".backup '${emergency_backup}'"
fi

install --owner="${database_owner%:*}" --group="${database_owner#*:}" \
  --mode=0640 "${temporary_dir}/quoter.sqlite" "${database_path}.new"
mv --force "${database_path}.new" "${database_path}"
systemctl start "${service_name}"
systemctl is-active --quiet "${service_name}"

echo "Restore complete. Review: journalctl -u ${service_name} --since today"
