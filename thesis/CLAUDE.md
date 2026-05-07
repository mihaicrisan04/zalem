# thesis/

UBB bachelor thesis manuscript, written in LaTeX. Topic: design and evaluation of a trustworthy AI shopping assistant for e-commerce — i.e., this thesis is *about* zalem.

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
- `chapters/chapter{1..7}_*.tex` — one file per chapter
- `style.sty` — UBB Faculty of Math & CS thesis class. **Do not edit** — institutional template.
- `references.bib` — bibliography (alpha style)
- `figures/` — graphics
- `.latexmkrc` — `$pdf_mode = 1; $out_dir = 'build';`
- `.zed/settings.json` — texlab on-save build, Skim forward search, tex-fmt formatter

## writing rules

- citations: append to `references.bib`, then also add the source to `docs/references.md` (project-wide rule from root CLAUDE.md)
- planning, outline, evaluation design, supervisor package live in `docs/bachelor-thesis/` — read those first when working on a chapter
- chapter 1 is drafted prose; chapters 2–7 are skeletons (section headers + brief notes)
