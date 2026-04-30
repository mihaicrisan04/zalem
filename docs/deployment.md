# Deployment

Self-hosted on a Dokploy VPS at `mihais-vps.xyz`. All four services share one VPS, fronted by Traefik (managed by Dokploy) which terminates TLS via Let's Encrypt.

## Architecture

| Service                    | Subdomain                     | Container port | Notes                                       |
| -------------------------- | ----------------------------- | -------------- | ------------------------------------------- |
| Next.js app                | `zalem.mihais-vps.xyz`        | `3000`         | Built from `apps/web/Dockerfile`            |
| Convex API (cloud origin)  | `api.zalem.mihais-vps.xyz`    | `3210`         | Used by browser as `NEXT_PUBLIC_CONVEX_URL` |
| Convex HTTP actions (site) | `site.zalem.mihais-vps.xyz`   | `3211`         | For HTTP routes / webhooks                  |
| Convex dashboard           | `convex.zalem.mihais-vps.xyz` | `6791`         | Admin UI, login with admin key              |

Convex backend is deployed via Dokploy's Convex template (Postgres-backed). Pipeline:

- push to `main` → GitHub Action runs `convex deploy` against self-hosted backend (schema + functions)
- push to `main` → Dokploy auto-deploy rebuilds the Next.js Docker image and rolls it

The two run independently. Convex deploys are usually faster than the Next.js build, so by the time the new client code goes live the new schema is already there.

---

## One-time setup

### 1. DNS records

Add four `A` records at your registrar, all pointing to your VPS public IP:

```
zalem.mihais-vps.xyz       → <vps-ip>
api.zalem.mihais-vps.xyz   → <vps-ip>
site.zalem.mihais-vps.xyz  → <vps-ip>
convex.zalem.mihais-vps.xyz → <vps-ip>
```

Or one wildcard: `*.zalem.mihais-vps.xyz → <vps-ip>`. Wait for propagation (`dig api.zalem.mihais-vps.xyz` should return your IP).

### 2. Switch Convex backend off the traefik.me URLs

In Dokploy, open the project → Convex compose stack.

**On the `backend` service:**

- Domains tab: replace the auto-generated traefik.me hostnames with custom domains.
  - Add domain `api.zalem.mihais-vps.xyz` → port `3210`, HTTPS on, Let's Encrypt cert.
  - Add domain `site.zalem.mihais-vps.xyz` → port `3211`, HTTPS on, Let's Encrypt cert.
- Environment tab: update these to match the new public URLs:

```
CONVEX_CLOUD_ORIGIN=https://api.zalem.mihais-vps.xyz
CONVEX_SITE_ORIGIN=https://site.zalem.mihais-vps.xyz
CLERK_JWT_ISSUER_DOMAIN=<your clerk frontend api url, e.g. https://clerk.your-app.com>
```

> `CLERK_JWT_ISSUER_DOMAIN` is read by `packages/backend/convex/auth.config.ts`. The value must match the `iss` claim in your Clerk JWT exactly — no trailing slash. For dev Clerk instances it's `https://<verb-noun-00>.clerk.accounts.dev`, for prod it's your custom Clerk frontend API domain.

**On the `dashboard` service:**

- Domains tab: add `convex.zalem.mihais-vps.xyz` → port `6791`.
- Environment tab: update `NEXT_PUBLIC_DEPLOYMENT_URL=https://api.zalem.mihais-vps.xyz`.

Redeploy the compose stack so all three pick up the new origins.

### 3. Migrate data from Convex Cloud → self-hosted

Run locally from the repo root, with your existing Convex Cloud credentials in `packages/backend/.env.local`:

```bash
cd packages/backend

# export current cloud snapshot — produces snapshot.zip
bunx convex export --path ./snapshot.zip

# now point the CLI at self-hosted using these env vars (do NOT commit them)
export CONVEX_SELF_HOSTED_URL=https://api.zalem.mihais-vps.xyz
export CONVEX_SELF_HOSTED_ADMIN_KEY=<paste admin key from dokploy backend container>

# import wipes any existing data on self-hosted and replaces with the snapshot
bunx convex import --replace-all ./snapshot.zip

# delete the snapshot when done — it contains user data
rm ./snapshot.zip
```

If you don't have the admin key handy, regenerate it by exec-ing into the backend container:

```bash
# on the VPS (or via dokploy's terminal for the backend service)
docker exec -it <convex-backend-container> ./generate_admin_key.sh
```

### 4. Push schema + functions to self-hosted

Same env vars as above:

```bash
cd packages/backend
bunx convex deploy --yes
```

Verify by opening `https://convex.zalem.mihais-vps.xyz` and logging in with the admin key — you should see your tables and functions.

### 5. Configure Clerk

Convex needs Clerk's JWT template. In Clerk dashboard → JWT Templates → New template → name `convex` (must match `applicationID: "convex"` in `auth.config.ts`). Use the standard Convex template. Save.

If your `CLERK_JWT_ISSUER_DOMAIN` was wrong in step 2, fix it now and redeploy the Convex backend service.

### 6. Create the web service in Dokploy

In the same Dokploy project, "Create Application":

- **Source**: connect your GitHub repo + branch `main`
- **Build type**: Dockerfile
- **Docker Context Path**: `.` (repo root — required so the Dockerfile can `COPY` workspace packages)
- **Dockerfile Path**: `apps/web/Dockerfile`
- **Domains**: `zalem.mihais-vps.xyz` → port `3000`, HTTPS on, Let's Encrypt
- **Build Args** (these get baked into the client bundle at build time):
  ```
  NEXT_PUBLIC_CONVEX_URL=https://api.zalem.mihais-vps.xyz
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your clerk publishable key>
  ```
- **Environment** (server-only secrets):
  ```
  CLERK_SECRET_KEY=<your clerk secret>
  ```
- **Auto Deploy**: enable for branch `main`

Click Deploy. First build takes ~3–5 min. Watch the build logs — if Bun install or `next build` errors, see Troubleshooting below.

### 7. Wire up GitHub Actions for Convex

Add two repository secrets in GitHub → Settings → Secrets → Actions:

```
CONVEX_SELF_HOSTED_URL=https://api.zalem.mihais-vps.xyz
CONVEX_SELF_HOSTED_ADMIN_KEY=<admin key>
```

`.github/workflows/deploy-convex.yml` is already in the repo. It triggers on pushes that touch `packages/backend/**` and runs `convex deploy` automatically.

### 8. Smoke test

Open `https://zalem.mihais-vps.xyz`. Sign in with Clerk. Verify a Convex query renders. Check browser devtools → Network → WS → there should be a WebSocket connection to `wss://api.zalem.mihais-vps.xyz/api/...`.

---

## Runbook

### Redeploy

- **Web only**: push to `main` (any change outside `packages/backend/`) — Dokploy auto-deploys. Manual: Dokploy UI → app → Deploy.
- **Convex only**: push to `main` touching `packages/backend/**` — GitHub Action deploys. Manual: `cd packages/backend && bunx convex deploy --yes` with the self-hosted env vars set.
- **Convex container itself** (image upgrade): Dokploy → Convex compose stack → Deploy.

### Rotate the Convex admin key

```bash
docker exec -it <convex-backend-container> ./generate_admin_key.sh
```

Update the GitHub secret `CONVEX_SELF_HOSTED_ADMIN_KEY` and any local `.env` files. Old keys remain valid until invalidated.

### Backups

The Postgres service backing Convex holds all your app data. In Dokploy → Postgres service → Backups: configure a daily volume backup or `pg_dump` schedule. For belt-and-suspenders, also run `bunx convex export --path snapshot.zip` periodically and stash off-site.

### View logs

Dokploy UI per service. Or on the VPS: `docker logs -f <container-name>`.

---

## Troubleshooting

**Build fails with `Cannot find module 'babel-plugin-react-compiler'`**
The `--linker=hoisted` flag in the Dockerfile should prevent this. If it still fires, exec into the builder layer and check `node_modules/babel-plugin-react-compiler/` exists. Workaround: temporarily set `reactCompiler: false` in `next.config.ts`.

**`next build` fails with `lightningcss-linux-x64-gnu` not found**
Means Tailwind v4's native binding didn't install. Confirm `--linker=hoisted` is set; rebuild without Docker layer cache (Dokploy → app → Settings → Clear Cache → Deploy).

**Browser console: `Could not connect to Convex backend`**

- DNS not propagated — `dig api.zalem.mihais-vps.xyz` should return your VPS IP.
- TLS cert not issued — Dokploy → Convex backend → Domains, watch the cert status. Let's Encrypt rate-limits — if you hit it, wait an hour.
- WebSocket blocked — ensure Dokploy/Traefik labels allow WS (default does).

**Clerk auth works but Convex queries return `Unauthenticated`**

- `CLERK_JWT_ISSUER_DOMAIN` on the Convex backend doesn't match the `iss` claim. Decode the JWT in browser devtools → Application → Cookies → `__session` (or wherever Clerk stores it) → paste at jwt.io. The `iss` field must equal `CLERK_JWT_ISSUER_DOMAIN` exactly, no trailing slash.
- JWT template name in Clerk is not `convex` (must match `applicationID` in `auth.config.ts`).

**Image is huge / cold start is slow**
Confirm `output: 'standalone'` is in `next.config.ts` and the runner stage of the Dockerfile copies from `.next/standalone` (not the full `.next/`).
