# Lessons Learned

Hard-won bugs, gotchas, and patterns discovered during development. Update this whenever something bites you.

## React / Next.js

- **hooks before returns**: never call `useEffect` or any hook after a conditional `return` — React Compiler and strict mode will break. caught in `checkout/page.tsx` where `useEffect` was called after an early return guard.
- **hydration mismatches with Base UI**: Base UI generates client-side IDs that differ from SSR. use `useMounted()` to defer rendering of these components until after hydration.
- **`useSyncExternalStore` > `useState + useEffect` for mount detection**: the old `useMounted` hook (useState + useEffect) causes two renders. `useSyncExternalStore` with `getServerSnapshot: () => false` does it in one.

## Convex

- **Convex actions can't be aborted client-side**: `useAction` doesn't support abort signals. the stop button clears `isLoading` state so the UI unblocks, but the server-side action runs to completion.
- **`useUIMessages` typing**: the hook returns `UsePaginatedQueryResult<UIMessage>` — use `UIMessagesQueryResult<typeof api.your.query>` to extract the proper message type instead of casting to `any[]`.

## Styling / Tailwind

- **font-sans mismatch**: the `@theme inline` block in `globals.css` had `--font-sans: "Inter Variable"` but the app loads Geist via `next/font/google`. these must match — use `var(--font-geist-sans)` to reference the font CSS variable set by next/font.
- **inline `<style>` tags**: avoid defining `@keyframes` inside component JSX. put them in `globals.css` so they're deduped and cacheable.

## Tooling

- **oxfmt reformats on save**: commit `.vscode/settings.json` with `formatOnSave: true` pointing to oxfmt so every contributor's editor formats consistently.
- **pre-existing lint warnings**: oxlint reports ~25 warnings in shadcn/generated files. these are expected — check that your changes don't add new ones.
- **`bun run ci`**: single command that runs `check` + `check-types`. use this before pushing.

## Performance

- **`contentVisibility: auto`**: CSS-native virtualization for product grids. set `contain-intrinsic-size` to the estimated card height so the browser can compute scroll height without rendering off-screen cards.
- **100ms `setInterval` in tracking hooks**: `useDwellTime` and `useViewportTracking` each run a 100ms interval that updates state. multiple product cards on screen means multiple intervals. acceptable for now but watch for jank on low-end devices.
