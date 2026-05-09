yes go ahead and prepare the spec doc and u can scafoold the promptfoo workspace but make sure this is done inteligently, for example if it will use pythong, add a uv config with mise possibly as i manage most deps through mise, this packages shoudl be separated enought, also ideally i want cli scripts and commands to run this properly,
alos tell me more about promptfoo this seems to be the heavy weight carrier but i have never heard of it so far and i dont know about it very much
in the spec i want to know how the new stucture and architecutre will look and what role it will play and how it will work,
u can even use asci diagrams or ascii sections for importnat sections that could benefit a visualization for better understnading on my part.

---

rewrote `docs/eval-system-plan.md` with the new Promptfoo-based direction (full architecture, ASCII diagrams, Promptfoo primer, workspace layout, data-flow diagram, 5-phase implementation plan); scaffolded `packages/eval/` as a bun workspace (no Python needed — Promptfoo is Node) with promptfooconfig.yaml, custom provider stub, 5 scorer skeletons, dataset YAML seed + README, snapshot lib, thesis export stub, bash CLI scripts (run/sweep/view/export) and a README; updated `docs/PLAN.md` phase 8 to reflect the direction change.
