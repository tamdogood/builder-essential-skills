#!/bin/sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "usage: $0 <radar-data-directory> <backup-directory>" >&2
  exit 1
fi

data_directory=$(cd "$1" && pwd)
mkdir -p "$2"
backup_directory=$(cd "$2" && pwd)
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
temporary="$backup_directory/.opportunity-radar-$timestamp.tar.gz.tmp"
destination="$backup_directory/opportunity-radar-$timestamp.tar.gz"

umask 077
tar -C "$data_directory" -czf "$temporary" .
mv "$temporary" "$destination"
sha256sum "$destination" > "$destination.sha256"
printf '%s\n' "$destination"
