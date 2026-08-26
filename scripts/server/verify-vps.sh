#!/usr/bin/env bash
set -Eeuo pipefail

echo "SSH configuration"
sshd -T | grep -E '^(passwordauthentication|kbdinteractiveauthentication|permitrootlogin|pubkeyauthentication) '

echo
echo "Firewall"
ufw status verbose

echo
echo "Listening ports"
ss --tcp --udp --listening --numeric --process

echo
echo "Failed units"
systemctl --failed

echo
echo "Quoter timers"
systemctl list-timers 'quoter-*'

echo
echo "Disk usage"
df --human-readable / /var/lib/quoter /var/backups/quoter

echo
echo "Pending package updates"
apt list --upgradable 2>/dev/null

echo
echo "Quoter file ownership"
namei --long /opt/quoter/current/quoter-linux-x64 || true
namei --long /var/lib/quoter/quoter.sqlite || true
