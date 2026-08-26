#!/usr/bin/env bash
set -Eeuo pipefail

readonly repository="${QUOTER_GITHUB_REPOSITORY:-quoter/quoter}"
readonly install_root="${QUOTER_INSTALL_ROOT:-/opt/quoter}"
readonly service_name="${QUOTER_SERVICE_NAME:-quoter.service}"

exec 9>"/run/lock/quoter-update.lock"
flock -n 9 || exit 0

release_json="$(curl --fail --silent --show-error --location \
  "https://api.github.com/repos/${repository}/releases/latest")"
tag="$(jq --exit-status --raw-output '.tag_name' <<<"${release_json}")"
version="${tag#v}"
release_dir="${install_root}/releases/${version}"
current_target="$(readlink -f "${install_root}/current" 2>/dev/null || true)"

if [[ "${current_target}" == "${release_dir}" ]]; then
  exit 0
fi

binary_url="$(jq --exit-status --raw-output \
  '.assets[] | select(.name == "quoter-linux-x64") | .browser_download_url' \
  <<<"${release_json}")"
checksum_url="$(jq --exit-status --raw-output \
  '.assets[] | select(.name == "quoter-linux-x64.sha256") | .browser_download_url' \
  <<<"${release_json}")"

temporary_dir="$(mktemp --directory /var/tmp/quoter-update.XXXXXX)"
trap 'rm -rf -- "${temporary_dir}"' EXIT

curl --fail --silent --show-error --location \
  --output "${temporary_dir}/quoter-linux-x64" "${binary_url}"
curl --fail --silent --show-error --location \
  --output "${temporary_dir}/quoter-linux-x64.sha256" "${checksum_url}"

(
  cd "${temporary_dir}"
  sha256sum --check quoter-linux-x64.sha256
)

if systemctl is-active --quiet "${service_name}"; then
  systemctl start quoter-backup.service
fi

install --directory --owner=root --group=root --mode=0755 "${release_dir}"
install --owner=root --group=root --mode=0755 \
  "${temporary_dir}/quoter-linux-x64" "${release_dir}/quoter-linux-x64"
printf '%s\n' "${version}" >"${release_dir}/VERSION"

ln --symbolic --force --no-dereference \
  "${release_dir}" "${install_root}/current.next"
mv --no-target-directory --force \
  "${install_root}/current.next" "${install_root}/current"

if systemctl restart "${service_name}"; then
  healthy_checks=0
  for _ in {1..15}; do
    if systemctl is-active --quiet "${service_name}"; then
      ((healthy_checks += 1))
      if [[ "${healthy_checks}" -ge 5 ]]; then
        logger --tag quoter-update "Installed Quoter ${version}"
        find "${install_root}/releases" -mindepth 1 -maxdepth 1 -type d \
          -printf '%T@ %p\n' | sort --numeric-sort --reverse | tail --lines=+4 \
          | cut --delimiter=' ' --fields=2- | xargs --no-run-if-empty rm -rf --
        exit 0
      fi
    else
      healthy_checks=0
    fi
    sleep 1
  done
fi

if [[ -n "${current_target}" && -d "${current_target}" ]]; then
  ln --symbolic --force --no-dereference \
    "${current_target}" "${install_root}/current.previous"
  mv --no-target-directory --force \
    "${install_root}/current.previous" "${install_root}/current"
  systemctl restart "${service_name}"
fi

logger --tag quoter-update --priority user.err \
  "Quoter ${version} failed its health check; restored previous release"
exit 1
