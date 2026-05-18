# WRITING.md

Project-specific writing rules for the zalem bachelor thesis manuscript.

For general academic writing guidance (IMRaD, tense, hedging, citations, LLM disclosure), use the `academic-writing` skill at `.claude/skills/academic-writing/SKILL.md`. This file is the project-specific layer on top. It does not repeat what the skill already covers.

## Hard rules

- never use em dashes. use commas, parentheses, or a new sentence
- do not over explain. one clear sentence beats three cautious ones

## Voice (extracted from project prompts in `prompts/`)

The user's natural voice in prompts is direct, opinionated, concrete, iteration-friendly, and impatient with fluff. The thesis register must be formal, but the spirit transfers.

- direct claims. when prior work has documented failures, name them and explain why this thesis differs. do not soften
- concrete over abstract. specific numbers ground the argument. project numbers already on hand: 32% recommendation accuracy of Rufus, 28% price hallucination, 300M users, $12B incremental sales, 4836 seeded reviews, target p95 < 50 ms for candidate generation
- iteration honesty. when a design changed during the project, say so briefly. "an initial co-occurrence-only design was extended to a switching hybrid because cold-start coverage was poor" reads stronger than pretending the final design was obvious
- pair technical and practical framing. tie every design decision to its consequence for users, cost, trust, or latency. the planning docs already do this. keep that pairing in the prose
- pushback over diplomacy. when an option is wrong, say it is wrong and give the reason. the user explicitly asked for adversarial review, not appeasement

## Words to prefer

- "so" over "thus"
- "from here on" over "henceforth"
- "this" over "the aforementioned"
- "because" over "due to the fact that"
- "to" over "in order to"
- "we" or "this thesis" over "the present work"

## Words to avoid

- "it is important to note that" — just state it
- "as can be seen" — point to the figure or table directly
- chains of weak hedges ("might possibly suggest that potentially")
- imported English idioms that do not add precision

## Citations

- cite at the end of the claim, before the period: `... a 28% price hallucination rate \cite{RufusWrong2024}.`
- group citations supporting the same claim into one bracket. distinguish citations that disagree
- every new citation must also be added to `docs/references.md` with a one-line note on why it was used

## Diagrams

- Mermaid for flowcharts, sequence diagrams, lifecycles. source in `thesis/diagrams/*.mmd`, rendered via `bun run thesis:diagrams`
- TikZ for the few figures that demand typographic polish (architecture, ER schema, two-stage pipeline)
- one short factual caption per figure. the figure carries the message, the caption labels it

## Project terminology

- the AI surface is the **advisor**, not the assistant or the chatbot
- the recommendation backbone is the **classical recommender** or the **classical layer**, not the baseline (the _baseline_ is the no-AI experimental condition in the user study)
- the system being studied is the **prototype** or **the system**, not the app
- (more entries to add as the user surfaces preferences)
