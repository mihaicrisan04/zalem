# Defense presentation

Minimal, Vercel-style HTML deck for the thesis defense, structured to the examiner's required academic flow. 12 slides, 16:9. Two slides embed short looping **Remotion** concept videos with transparent backgrounds (the UI mockups float on the slide). The live app demo happens after the slides.

## Files
- `index.html` — the deck (self-contained: inline CSS/JS, Geist via Google Fonts)
- `script.md` — full speaker script (per-slide notes + demo plan)
- `generate-pdf.sh` — render the deck to a PDF (video slides fall back to poster stills)
- `zalem-defense.pdf` — generated output
- `videos/chat-demo/` — Remotion project for the advisor-chat loop → `out/chat-demo.webm`
- `videos/context-demo/` — Remotion project for the context-building loop → `out/context-demo.webm`
- `research/` — defense prep backed by deep study of the thesis + code:
  - `qa-prep.md` — committee Q&A cheat-sheet (answers to the examiner's exact question list, with file:line)
  - `defense-plan.md` — slide plan + the **architecture truth** + eval/build notes
  - `research-dossier.md` — raw findings (thesis outline, SOTA citations + years, mechanics)

## Slides
1. Title — thesis title + author
2. Contents — the five chapters
3. Domain — the field (classical recsys vs LLMs → grounded hybrid)
4. State of the art — the Amazon Rufus case
5. The idea + architecture — grounded by construction (two-lane catalog-spine diagram)
6. Functionality 1 — the grounded advisor *(video)*
7. Functionality 2 — live context *(video)*
8. Functionality 3 — review grounding (illustration)
9. Results — the grounding ablation
10. Results — the configuration sweep
11. Conclusions — contributions · limits · future work
12. Thank you

## Present
Open `index.html` in **Chrome** (transparent WebM with alpha is a Chrome/Firefox feature; Safari won't show the video transparency). The two video slides autoplay and restart on entry.

| key | action |
|-----|--------|
| `→` `Space` / `←` | next / previous |
| `1`–`9` | jump to slide |
| `F` | fullscreen |
| `N` | toggle speaker notes |
| `P` | print / save as PDF |
| click | right = next, far-left = back |

A presentation clicker works out of the box. The deck is a fixed 1280×720 canvas scaled to fit, so it looks identical on screen and in the PDF.

## Export to PDF
```bash
./generate-pdf.sh                 # → zalem-defense.pdf
CHROME=/path/to/chrome ./generate-pdf.sh   # if Chrome isn't auto-found
```
The video slides print their poster stills (PDF can't play video).

## Re-rendering the videos
Each video is its own self-contained Remotion subproject. After editing a composition under `src/`:
```bash
cd videos/chat-demo     # or videos/context-demo
npm install             # first time only
npm run render          # → out/<name>.webm  (transparent vp9, scale 2)
npm run still           # → out/<name>-poster.png  (PDF fallback frame)
npm run studio          # live preview while editing
```
Transparency is configured in each `remotion.config.ts` (`codec=vp9`, `pixelFormat=yuva420p`, `imageFormat=png`). After re-rendering, re-run `./generate-pdf.sh`.

## Honest note for the defense
The architecture slide depicts what the **code** does (two independent paths — classical engine for the store rails; the advisor reads the catalog directly; one optional `getRecommendations` bridge). The thesis prose overstates the ranking in a few spots ("RRF k=60", "two-stage LLM rerank", switching thresholds) — see `research/qa-prep.md` for how to address it if the committee opens the code. The grounding claims are fully code-backed.

## Design
Vercel Geist system — `#171717` on `#ffffff`, hairline borders, blue `#006bff` accent, semantic red/green only where it earns it. The two videos share one theme (`src/theme.ts`) so motion, type, and cards stay consistent — and the cards mirror the real store card. Less is more: one idea per slide, the speaker carries the rest.
