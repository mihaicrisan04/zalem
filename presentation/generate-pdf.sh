#!/usr/bin/env bash
# Render index.html → a pixel-perfect 16:9 PDF (one slide per page) using headless Chrome.
# Usage: ./generate-pdf.sh [output.pdf]
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IN="file://$DIR/index.html"
OUT="${1:-$DIR/zalem-defense.pdf}"

# locate a Chromium-family browser
CANDIDATES=(
  "${CHROME:-}"
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  "/Applications/Chromium.app/Contents/MacOS/Chromium"
  "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
  "$(command -v google-chrome 2>/dev/null || true)"
  "$(command -v chromium 2>/dev/null || true)"
)
CHROME_BIN=""
for c in "${CANDIDATES[@]}"; do
  if [[ -n "$c" && -x "$c" ]]; then CHROME_BIN="$c"; break; fi
done

if [[ -z "$CHROME_BIN" ]]; then
  echo "No Chrome/Chromium found. Either install Chrome, set CHROME=/path/to/chrome," >&2
  echo "or just open index.html and use Cmd+P → Save as PDF → Landscape → margins None." >&2
  exit 1
fi

echo "Rendering with: $CHROME_BIN"
"$CHROME_BIN" \
  --headless=new \
  --disable-gpu \
  --no-pdf-header-footer \
  --print-to-pdf-no-header \
  --virtual-time-budget=4000 \
  --run-all-compositor-stages-before-draw \
  --print-to-pdf="$OUT" \
  "$IN" 2>/dev/null || \
"$CHROME_BIN" --headless --disable-gpu --print-to-pdf-no-header \
  --virtual-time-budget=4000 --print-to-pdf="$OUT" "$IN"

echo "→ $OUT"
