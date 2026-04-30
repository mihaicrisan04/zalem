i want to deploy this application. i have a vps on my domain and i just installe dokploy there. go ahead and reserach and help me deploy it and create a nice deployment pipeline. dokploy also supports convex and i can host there the convex part as well

so i have a vps that runs dokploy its on mihais-vps.xyz. now i want to make this project run at zalem.mihais-vps.xyz and the services below.
i have setup just the convex template and generate an admin key for convex but that is it. i see that dokploy uses traefik for the generated urls for convex, but that means that for this we use traefik as a middleman to server our requests. what do u think?

i can add a record per service. but i like more ethe api.zalem.mihais-vps.xyz and the rest not named like u did above

convex.zalem is better

i like nixpacks. reserach to see for any incompatiblities and if u find any we can just use the dockerfile
convex is already deployed and i think it uses postgres by fefault now.
skip pr previews becasue i cant generate convex deploymens and clerk deployments just like that when i pr.

now the convex domain is still the default traefik one and i havent pushed anything, its not actually connected to the app. i alos have to copy the actual data from teh cloud convex as a bakup in zip and move it there anyway

---

researched dokploy + nixpacks + convex self-host, then set up full self-hosted deployment to mihais-vps.xyz.

architecture decided:

- web app at `zalem.mihais-vps.xyz` (next.js dockerfile build)
- convex api at `api.zalem.mihais-vps.xyz` (cloud origin, port 3210)
- convex http actions at `site.zalem.mihais-vps.xyz` (port 3211)
- convex dashboard at `convex.zalem.mihais-vps.xyz` (port 6791)
- traefik (managed by dokploy) terminates TLS via Let's Encrypt for all four

ditched nixpacks after research turned up two blocking issues for this stack: (1) nixpacks pins bun via nixpkgs which lags 1.3.10, (2) next.js 16 + react compiler + bun has an open turbopack module-resolution bug (bun#24419) that breaks `next build`. went with custom dockerfile using `--linker=hoisted` to sidestep both.

files written:

- `apps/web/Dockerfile` — multi-stage: oven/bun:1.3.10 deps + builder, node:22-slim runner. uses `--linker=hoisted`, builds via `turbo --filter=web`, runner serves from `.next/standalone`
- `apps/web/next.config.ts` — added `output: 'standalone'` + `outputFileTracingRoot` (turborepo standalone gotcha)
- `.dockerignore` at repo root
- `.github/workflows/deploy-convex.yml` — runs `convex deploy` on push to main when packages/backend changes, uses `CONVEX_SELF_HOSTED_URL` + `CONVEX_SELF_HOSTED_ADMIN_KEY` secrets
- `docs/deployment.md` — full guide: DNS, dokploy UI clicks for convex domain swap, cloud→self-hosted data migration via export/import, clerk JWT issuer setup, web service creation, github secrets, smoke test, runbook
- deleted `apps/web/vercel.json` (no longer needed)

pipeline: convex deploy and next.js deploy run independently on push to main, both watch same branch. user still needs to do dokploy UI steps + DNS + data migration locally — all spelled out in `docs/deployment.md`.
