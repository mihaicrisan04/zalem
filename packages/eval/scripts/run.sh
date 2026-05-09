#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# single-config eval — uses cache, intended for fast iteration during dev
exec bun x promptfoo eval "$@"
