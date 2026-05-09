#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# regenerates LaTeX tables + pareto plots from results/latest.json into
# thesis/figures/. safe to run repeatedly without re-running the sweep.
exec bun run src/reports/thesisExport.ts "$@"
