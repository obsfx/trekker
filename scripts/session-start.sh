#!/bin/sh

set -eu

if ! command -v trekker >/dev/null 2>&1; then
  printf '%s\n' 'Trekker: CLI not found. Install it with `npm install -g @obsfx/trekker` to enable Trekker workflows in Codex.'
  exit 0
fi

if [ ! -d ".trekker" ]; then
  printf '%s\n' 'Trekker: no `.trekker` directory in this workspace. Run `trekker init` when you want persistent task tracking.'
  exit 0
fi

toon_total() {
  printf '%s\n' "$1" | sed -n 's/^total:[[:space:]]*//p' | head -n 1
}

in_progress="$(trekker --toon task list --status in_progress 2>/dev/null || true)"
ready="$(trekker --toon ready 2>/dev/null || true)"
history="$(trekker --toon history --limit 5 2>/dev/null || true)"

printf '# Trekker Session Context\n\n'
printf '%s\n\n' 'Track work with the `trekker` CLI in the shell. Add `--toon` for structured output.'
printf '%s\n\n' 'Search first with `trekker search "<keyword>"` before creating or updating tracked work.'

if [ "$(toon_total "$in_progress")" != "0" ] && [ -n "$in_progress" ]; then
  printf '## In-Progress Tasks\n\n'
  printf '%s\n\n' "$in_progress"
elif [ "$(toon_total "$ready")" != "0" ] && [ -n "$ready" ]; then
  printf '## Ready Tasks\n\n'
  printf '%s\n\n' "$ready"
else
  printf '%s\n\n' 'No in-progress or ready tasks found.'
fi

if [ -n "$history" ]; then
  printf '## Recent Activity\n\n'
  printf '%s\n' "$history"
fi
