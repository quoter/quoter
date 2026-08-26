#!/usr/bin/env bash
set -Eeuo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

: "${ADMIN_USER:?Set ADMIN_USER to the administrator account name}"
: "${SSH_PUBLIC_KEY:?Set SSH_PUBLIC_KEY to the administrator public key}"

apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install --yes \
  ca-certificates curl jq python3-venv sqlite3 ufw unattended-upgrades

if [[ ! -x /opt/b2-cli/bin/b2 ]]; then
  python3 -m venv /opt/b2-cli
  /opt/b2-cli/bin/pip install --upgrade b2
fi
ln --symbolic --force /opt/b2-cli/bin/b2 /usr/local/bin/b2

if ! id "${ADMIN_USER}" >/dev/null 2>&1; then
  adduser --disabled-password --gecos "" "${ADMIN_USER}"
fi
usermod --append --groups sudo "${ADMIN_USER}"

install --directory --owner="${ADMIN_USER}" --group="${ADMIN_USER}" \
  --mode=0700 "/home/${ADMIN_USER}/.ssh"
printf '%s\n' "${SSH_PUBLIC_KEY}" >"/home/${ADMIN_USER}/.ssh/authorized_keys"
chown "${ADMIN_USER}:${ADMIN_USER}" "/home/${ADMIN_USER}/.ssh/authorized_keys"
chmod 0600 "/home/${ADMIN_USER}/.ssh/authorized_keys"

if ! id quoter >/dev/null 2>&1; then
  useradd --system --home-dir /var/lib/quoter --create-home \
    --shell /usr/sbin/nologin quoter
fi
if ! id quoter-backup >/dev/null 2>&1; then
  useradd --system --home-dir /var/backups/quoter --create-home \
    --shell /usr/sbin/nologin quoter-backup
fi
usermod --append --groups quoter quoter-backup

install --directory --owner=root --group=root --mode=0755 \
  /opt/quoter /opt/quoter/releases /usr/local/libexec/quoter
install --directory --owner=quoter --group=quoter --mode=0750 /var/lib/quoter
install --directory --owner=quoter-backup --group=quoter-backup \
  --mode=0750 /var/backups/quoter
install --directory --owner=root --group=quoter --mode=0750 /etc/quoter

cat >/etc/ssh/sshd_config.d/50-quoter-hardening.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
PermitEmptyPasswords no
MaxAuthTries 3
X11Forwarding no
EOF
sshd -t

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw --force enable

dpkg-reconfigure --frontend=noninteractive unattended-upgrades
cat >/etc/apt/apt.conf.d/52quoter-unattended-upgrades-local <<'EOF'
Unattended-Upgrade::Automatic-Reboot "false";
EOF
systemctl enable --now systemd-timesyncd.service

install --directory --owner=root --group=root --mode=0755 \
  /etc/systemd/journald.conf.d
cat >/etc/systemd/journald.conf.d/50-quoter-limits.conf <<'EOF'
[Journal]
SystemMaxUse=500M
RuntimeMaxUse=100M
MaxRetentionSec=1month
EOF
systemctl restart systemd-journald.service

cat <<EOF
Base setup is complete.

1. Keep this SSH session and the Bloom Host recovery console open.
2. Open a second SSH session as ${ADMIN_USER} and confirm sudo works.
3. Run finalize-ssh.sh from that verified session to disable root SSH login.
4. Install the service files and configure /etc/quoter.
EOF
