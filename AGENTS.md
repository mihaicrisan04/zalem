# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev           # start all apps + backend (turbo)
bun run dev:web       # start only the Next.js web app
bun run dev:server    # start only the Convex backend
bun run build         # build everything
bun run check-types   # typecheck all packages

# lint & format (oxlint + oxfmt, run from root)
bun run lint          # oxlint
bun run format        # oxfmt --write
bun run format:check  # oxfmt --check
bun run check         # both lint + format check
```

Always run `bun run check` before committing to catch lint/format issues.

## Architecture

Turborepo monorepo using bun workspaces. Package manager is **bun** (v1.3.10).

- `apps/web` — Next.js 16 app (port 3001), uses React Compiler, Clerk auth, Tailwind v4
- `packages/backend` — Convex backend (schema, functions, auth config live in `packages/backend/convex/`)
- `packages/ui` — shared component library (shadcn/ui + optics design system). Import as `@zalem/ui/components/button`, `@zalem/ui/lib/utils`, etc.
- `packages/env` — type-safe env validation with `@t3-oss/env-nextjs`. Export: `@zalem/env/web`
- `packages/config` — shared `tsconfig.base.json` (all packages extend it)

## Key conventions

- TypeScript project references (`composite: true`) — root `tsconfig.json` has `references` to each package
- Convex auto-generated code is in `packages/backend/convex/_generated/` — never edit, ignored by linter
- Shared UI components go in `packages/ui`, app-specific components go in `apps/web/src/components`
- Add shadcn components: `npx shadcn@latest add <component> -c packages/ui`
- Env vars: Convex env in `packages/backend/.env.local`, web app env in `apps/web/.env`

## Project documentation approach

This project follows a **document-everything** approach. All research, plans, decisions, direction changes, and iterations are recorded.

### Documentation structure

- `docs/PLAN.md` — master plan with phases overview and links to detailed phase plans
- `docs/store-ui-spec.md` — emag-inspired store UI spec (pages, components, flows)
- `docs/data-layer-plan.md` — Convex schema, queries, mutations, indexes, data flow diagrams
- `docs/recommendations-plan.md` — algorithm selection, scoring, cold-start strategies
- `docs/ai-integration-plan.md` — LLM integration, UX, business case, architecture
- `docs/ai-assistant-research.md` — initial research compilation (papers, architectures)
- `docs/references.md` — all academic papers, studies, engineering blogs, and market reports used to inform decisions
- `prompts/` — timestamped log of every user prompt and AI response summary

### Rules

- when making a plan change or direction change, update the relevant doc and note what changed and why
- when referencing a paper, study, or significant source, add it to `docs/references.md`
- when a new idea or finding emerges during implementation, document it in the relevant phase doc

### Prompt logging

All user prompts are logged in `prompts/` as markdown files for process documentation.

- only save a prompt **after** the AI successfully responds to the task — never before, never if the task fails or can't be done
- filename format: `YYYYMMDD-HHMMSS-short-slug.md` (timestamp of when the conversation happened, like migration files)
- file contents: the exact user prompt as given, followed by a `---` separator and a one-line summary of what the prompt did and what the AI responded
- keep the prompt text verbatim — do not clean up typos or rephrase
