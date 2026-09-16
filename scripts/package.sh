#!/bin/sh
set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
version=$(python -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$root/manifest.json")
output="$root/dist/session-exporter-for-claude-code-$version.zip"

mkdir -p "$root/dist"
rm -f "$output"
cd "$root"
zip -q -r "$output" manifest.json popup.html popup.js exporter.js icons
unzip -Z1 "$output" | grep -qx manifest.json
printf '%s\n' "$output"
