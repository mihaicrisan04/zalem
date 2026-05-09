#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# opens local web UI on localhost:15500 backed by the latest results
exec bun x promptfoo view "$@"
