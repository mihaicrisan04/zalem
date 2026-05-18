# thesis/

UBB bachelor thesis manuscript, written in LaTeX. Topic: design and evaluation of a trustworthy AI shopping assistant for e-commerce — i.e., this thesis is _about_ zalem.

## build

```bash
cd thesis && latexmk        # one-shot build
cd thesis && latexmk -pvc   # watch mode
cd thesis && latexmk -c     # clean aux files
```

Or from repo root: `bun run thesis:build` / `thesis:watch` / `thesis:clean`.

Output: `thesis/build/main.pdf` (gitignored).

## structure

- `main.tex` — entry, abstract, `\input{}`s the chapters
- `chapters/chapter{1..8}_*.tex` — one file per chapter (1 intro, 2 background, 3 problem, 4 design, 5 implementation, 6 evaluation methodology, 7 results, 8 conclusions and future work). The separate "discussion" chapter that the institutional template suggests has been folded into the closing section of chapter 7 (`\section{Summary and Discussion}`); the user can re-split it later if the faculty submission rules require it.
- `style.sty` — UBB Faculty of Math & CS thesis class. **Do not edit** — institutional template.
- `references.bib` — bibliography (alpha style)
- `figures/` — graphics (hand-made + mermaid-rendered PDFs)
- `diagrams/` — mermaid `.mmd` source + `mermaid-config.json` (Palatino-ish theme)
- `.latexmkrc` — `$pdf_mode = 1; $out_dir = 'build';`
- `.zed/settings.json` — texlab on-save build, Skim forward search, tex-fmt formatter

## diagrams

- write `.mmd` files in `diagrams/`, render with `bun run thesis:diagrams` (from repo root) — outputs PDFs into `figures/`
- `\includegraphics{name.pdf}` from any chapter (graphicspath is set to `figures/`)
- mermaid-cli is installed at repo root (`@mermaid-js/mermaid-cli`), uses Puppeteer/Chromium under the hood
- `thesis:diagrams` is **not** chained into `thesis:build` — run it manually after editing a `.mmd`
- TikZ is reserved for the few canonical figures that need typographic polish (architecture, ER, two-stage pipeline). Mermaid handles the rest (sequence, data flow, lifecycle, eval-harness flow)

## writing rules

- citations: append to `references.bib`, then also add the source to `docs/references.md` (project-wide rule from root CLAUDE.md)
- planning, outline, evaluation design, supervisor package live in `docs/bachelor-thesis/` — read those first when working on a chapter
- all 9 chapters are currently skeletons with header comments pointing at the source `docs/` files for each section
- writing guidelines for prose live in `thesis/WRITING.md` (style, voice, conventions)

## post-thesis polish (deferred)

- after the thesis content is finalized and submitted, investigate a visual upgrade in the spirit of MIT EECS theses (memoir or KOMA-Script class, Latin Modern or EB Garamond, microtype, booktabs, minted for code, custom titlesec headings, sidebar margin notes if appropriate)
- verify with the UBB faculty submission rules first. some elements of `style.sty` may be required for accreditation. low-risk improvements that do not change the document class (microtype, booktabs, minted, caption package) usually fly under the radar
- this is a pure aesthetic pass and must not delay or block the content work
