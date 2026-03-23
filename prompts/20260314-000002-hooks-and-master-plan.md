alright also not in a file or somewher what hooks i want to use for tihs:
i installed these 2 for now:
❯ bunx shadcn@latest add https://www.shadcn.io/r/use-mouse-position.json\?token\=08edbf192a0fb256c6901821392948272b4f477570842d23b6fe5d79de8d1001
✔ Checking registry.
✔ Installing components.
✔ Created 1 file:
  - apps/web/src/hooks/use-mouse-position.tsx
ℹ Updated 1 file:
  - packages/ui/src/styles/globals.css
~/dev/personal/zalem/apps/web main ?2                                                                                                     6s
❯ bunx shadcn@latest add https://www.shadcn.io/r/use-hover.json\?token\=08edbf192a0fb256c6901821392948272b4f477570842d23b6fe5d79de8d1001
✔ Checking registry.
✔ Installing components.
✔ Created 1 file:
  - apps/web/src/hooks/use-hover.tsx
ℹ Updated 1 file:
  - packages/ui/src/styles/globals.css

[...hook code examples and emag discussion...]

also not that i want you to creat a plan, a multi phase plan. so the first part would be to build out a normal store (similar like emag in romania). so that means before we do any ai realted things, i want ot build a modular store that uses state of the art recommendations algorithms  and ai on top of those.

help me create an overview plan and then for each phase we will detail more steps.

tell me if you have any suggestions that would help make the process better and smarter

---

> AI reviewed hooks, recommended `useHover` + `useDwellTime` over raw `useMousePosition` for tracking, created 7-phase master plan in `docs/PLAN.md` covering: data layer → store UI → static recommendations → behavior tracking → triggers → LLM integration → optimization.
