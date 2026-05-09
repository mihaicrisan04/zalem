#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# full sweep — bypasses cache so cost/latency numbers are real
ts="$(date -u +%Y%m%d-%H%M%S)"
exec bun x promptfoo eval --no-cache --output "results/sweep-${ts}.json" "$@"
