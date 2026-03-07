# zalem

turborepo monorepo with bun workspaces.

## stack

- **apps/web** — Next.js 16, React Compiler, Clerk auth, Tailwind v4
- **packages/backend** — Convex (schema, functions, auth in `convex/`)
- **packages/ui** — shared shadcn/ui components + optics design system
- **packages/env** — type-safe env validation (`@t3-oss/env-nextjs`)
- **packages/config** — shared tsconfig base

## setup

```bash
bun install
bun run dev:setup     # configure Convex project
```

copy env vars from `packages/backend/.env.local` to `apps/web/.env`, set `CLERK_PUBLISHABLE_KEY` there too. see [Convex + Clerk docs](https://docs.convex.dev/auth/clerk) for auth setup.

## dev

```bash
bun run dev           # start everything
bun run dev:web       # just the web app (port 3001)
bun run dev:server    # just Convex
```

## lint & format

uses oxlint + oxfmt (not eslint/prettier).

```bash
bun run check         # lint + format check
bun run lint          # oxlint only
bun run format        # oxfmt --write
```

## shared UI

add shadcn primitives to the shared package:

```bash
npx shadcn@latest add <component> -c packages/ui
```

import them as:

```tsx
import { Button } from "@zalem/ui/components/button";
```

app-specific components go in `apps/web/src/components`.
