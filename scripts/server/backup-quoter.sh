#!/usr/bin/env bash
set -Eeuo pipefail

: "${B2_BUCKET:?B2_BUCKET is required}"

readonly database_path="${QUOTER_DATABASE_PATH:-/var/lib/quoter/quoter.sqlite}"
readonly backup_root="${QUOTER_BACKUP_ROOT:-/var/backups/quoter}"
readonly b2_prefix="${B2_PREFIX:-quoter}"

timestamp="$(date --utc +%Y-%m-%dT%H-%M-%SZ)"
temporary_dir="$(mktemp --directory "${backup_root}/staging.XXXXXX")"
trap 'rm -rf -- "${temporary_dir}"' EXIT

snapshot="${temporary_dir}/quoter.sqlite"
sqlite3 "${database_path}" ".backup '${snapshot}'"

integrity="$(sqlite3 "${snapshot}" 'PRAGMA integrity_check;')"
if [[ "${integrity}" != "ok" ]]; then
  echo "SQLite integrity check failed: ${integrity}" >&2
  exit 1
fi

version="unknown"
if [[ -f /opt/quoter/current/VERSION ]]; then
  version="$(</opt/quoter/current/VERSION)"
fi
schema_version="$(sqlite3 "${snapshot}" \
  'SELECT COUNT(*) FROM __drizzle_migrations;')"

jq --null-input \
  --arg created_at "${timestamp}" \
  --arg version "${version}" \
  --argjson schema_version "${schema_version}" \
  '{createdAt: $created_at, version: $version, schemaVersion: $schema_version}' \
  >"${temporary_dir}/metadata.json"

archive="${backup_root}/quoter-${timestamp}.tar.gz"
tar --create --gzip --file "${archive}" \
  --directory "${temporary_dir}" quoter.sqlite metadata.json
sha256sum "${archive}" >"${archive}.sha256"

b2 file upload --quiet "${B2_BUCKET}" "${archive}" \
  "${b2_prefix}/$(basename "${archive}")"
b2 file upload --quiet "${B2_BUCKET}" "${archive}.sha256" \
  "${b2_prefix}/$(basename "${archive}.sha256")"

find "${backup_root}" -maxdepth 1 -type f -name 'quoter-*.tar.gz*' \
  -mtime +7 -delete

logger --tag quoter-backup "Uploaded ${archive} to B2"
