#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script through sudo from the verified administrator session." >&2
  exit 1
fi

cat >>/etc/ssh/sshd_config.d/50-quoter-hardening.conf <<'EOF'
PermitRootLogin no
EOF
sshd -t
systemctl reload ssh.service
echo "Direct root SSH login is disabled. Keep the current session open for verification."
