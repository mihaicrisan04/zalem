# deployment plan — Vercel + Convex + Clerk

two separate deployments: Next.js frontend on Vercel, Convex backend on Convex cloud. wired together via `convex deploy --cmd` so a single Vercel build deploys both.

---

## 1. Convex production setup

- go to [dashboard.convex.dev](https://dashboard.convex.dev), create a **production deployment**
- generate a **Production Deploy Key** (Settings → Deploy Key)
- in the production deployment's env vars, set `CLERK_JWT_ISSUER_DOMAIN` to your Clerk production Frontend API URL (e.g. `https://clerk.yourdomain.com`)

## 2. Clerk production setup

- create a **production instance** in Clerk dashboard (separate from dev)
- production Clerk **requires a custom domain** — can't use `*.vercel.app`
- note down:
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (`pk_live_...`)
  - `CLERK_SECRET_KEY` (`sk_live_...`)
  - Frontend API URL (becomes `CLERK_JWT_ISSUER_DOMAIN` in Convex)

## 3. Vercel project config

| setting          | value                              |
| ---------------- | ---------------------------------- |
| root directory   | `apps/web`                         |
| framework        | Next.js (auto-detected)            |
| build command    | codified in `apps/web/vercel.json` |
| output directory | default (`.next`)                  |
| install command  | auto-detected (bun)                |

**build command** (in `vercel.json`):

```
cd ../.. && npx convex deploy --cmd 'cd apps/web && npx next build' --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL
```

this does:

1. goes to repo root (Vercel scopes to `apps/web`)
2. deploys Convex functions to production
3. injects `NEXT_PUBLIC_CONVEX_URL` automatically
4. runs the Next.js build

## 4. Vercel environment variables

| variable                            | value                 | env        |
| ----------------------------------- | --------------------- | ---------- |
| `CONVEX_DEPLOY_KEY`                 | from Convex dashboard | production |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...`         | production |
| `CLERK_SECRET_KEY`                  | `sk_live_...`         | production |

`NEXT_PUBLIC_CONVEX_URL` is **not** set manually — `convex deploy` injects it.

for **preview deployments**: use a separate Convex preview deploy key + Clerk dev keys.

## 5. domain setup order

1. add domain to Vercel (Project Settings → Domains)
2. add domain to Clerk production instance + configure DNS (`clerk.yourdomain.com` CNAME)
3. set `CLERK_JWT_ISSUER_DOMAIN` in Convex production dashboard to `https://clerk.yourdomain.com`

## 6. gotchas

- **bun works on Vercel** — detects `bun.lock` automatically. make sure it's committed
- **`@zalem/env` validates env at build time** — `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` must exist during build (they will with this setup)
- **`workspace:*` and `catalog:`** resolve at install time, no special Vercel config needed
- **turborepo 2.8+** has stable bun support with granular lockfile analysis

## 7. deployment checklist

- [ ] commit and push `bun.lock`
- [ ] create Convex production deployment + generate deploy key
- [ ] set `CLERK_JWT_ISSUER_DOMAIN` in Convex production dashboard
- [ ] create Clerk production instance with custom domain
- [ ] import repo in Vercel, set root directory to `apps/web`
- [ ] add env vars in Vercel dashboard
- [ ] configure custom domain in Vercel
- [ ] deploy
