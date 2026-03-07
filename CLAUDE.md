# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
