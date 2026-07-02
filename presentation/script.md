# Thesis Defense — Speaker Script

**Thesis:** *An Architectural Proposal for a Hybrid LLM-Augmented Shopping Recommender with Grounded Output* · **Prototype:** Zalem · **Author:** Mihai-Dan Crisan · **Supervisor:** Assoc. Prof. PhD Adriana Guran

> Companion to `index.html` (13 slides). The same notes are built into the deck — press **N** while presenting.
> Structure follows the examiner's required flow: title → contents → domain → state of the art → idea & approach → 3 functionalities → results → conclusions → **Demo** → thank you (live app demo + your 1–2 min video).
> Slides 6 and 7 are short looping concept videos (transparent Remotion). They autoplay and restart on entry — talk over them. The **live app demo** comes after the slides.
> Full committee Q&A prep is in **`research/qa-prep.md`** — including **Part 0, "Defending the abstract"**, the single most-mined paragraph. Research backing is in **`research/defense-plan.md`** and **`research/research-dossier.md`**.

---

### Opening move — if they ask "summarize your contribution" / "walk us through your abstract"
> *(Very common opener. This 90-second answer leads with the strongest result and pre-phrases the three abstract claims that oversell the code — so the landmines are defused before anyone opens the thesis. See `qa-prep.md` Part 0.)*
>
> "My thesis argues that AI shopping assistants aren't confidently wrong because the problem is hard — they're wrong because of *how* the model is wired in. To show that, I built Zalem, a working store, and then ran a controlled ablation: same model, same catalog, and I toggle only one thing — whether the model can read the catalog. With grounding off, it makes twice as many specific price and rating claims, two-thirds of them don't match the store, and — tellingly — the AI judges *prefer* that confident, fabricating version. Turn grounding back on and factuality jumps from 0.53 to 0.76. So grounding has to be checked by database, not by taste.
>
> The design rests on three decisions. First, it's reactive — the user always starts the call; behavior signals only prepare context. Second, when the advisor needs product candidates it calls a classical recommendation engine and then *selects among and explains* them — it never invents products. Third, the output is identifier-first: the model emits product IDs so facts can be rendered from live catalog data rather than generated, and every claim is validated at the tool and pipeline boundaries and measured in my evaluation harness. That harness is where I pick the shipped configuration — an eight-config sweep on grounded quality, cost and latency, where, notably, the *cheapest* model won."
>
> *(If pressed on any of the three: "select-and-explain, not a numeric re-rank"; "ID-first output, chat-card rendering is the next step"; "validated at the boundaries and measured, not a runtime strip filter." All three are in `qa-prep.md` Part 0.)*

---

### 1 · Title
> Good morning. My thesis is "An Architectural Proposal for a Hybrid LLM-Augmented Shopping Recommender with Grounded Output." I'm Mihai-Dan Crisan, supervised by Professor Adriana Guran; the prototype is a working store, Zalem. The one-line version: today's AI shopping assistants are confidently wrong because the model is allowed to invent facts — I built one where, by construction, it can't.

### 2 · Contents
> The thesis runs in five chapters: the background and related work, the theoretical foundations, the Zalem case study where I build the system, the evaluation, and conclusions. Today I'll focus on the idea, three core features, and the results.

### 3 · Domain — the field
> The field sits between two tools that each solve half the problem. Classical recommenders narrow a huge catalog accurately, but they're opaque — they never tell you why an item was chosen. LLMs can explain, summarize reviews and surface tradeoffs — but they hallucinate prices, specs, even review themes. My thesis is about the hybrid: an advisor that explains without inventing.

### 4 · State of the art — the Rufus case
> The reference point for deployed conversational shopping is Amazon Rufus — over 300 million users, around 12 billion dollars in incremental sales. But it has well-documented failures: it picks the right product about a third of the time, gets a quarter of prices wrong, pushes its own brand 83% of the time, and fabricates review themes. Honest caveat I state in the thesis — these figures come from two 2024 trade articles, not peer-reviewed studies; I use them as a documented target to design against, and my own claims rest on my evaluation, not theirs.

### 5 · The idea + architecture *(keystone)*
> My design principle is hydration over generation: the model selects and explains, but never sources a fact — every price, rating and spec is read from the live catalog at request time. The architecture is two independent paths around one catalog. The classical engine powers the store's recommendation rails — similar, frequently-bought, trending, recommended-for-you — and never calls the LLM. The AI advisor is a separate path that reads the catalog directly through read-only tools; the only link is one optional tool it can call on demand. The advisor's output then passes a three-stage validation gate. Grounding here isn't a filter at the end — it's the direction every fact flows: up, out of the catalog.
>
> **Honest note for Q&A** (committees ask from the code — full versions in `qa-prep.md` Part 0):
> - **"three-stage validation":** it's enforced at the tool + review-pipeline boundaries and *measured* in the eval harness — **not** a runtime per-answer gate. At request time `validationPassed` is telemetry, not a blocking filter. Say "validated at the boundaries and measured," never "a live filter that strips claims from each answer."
> - **Ranking:** the thesis prose calls the rail fusion "RRF, k=60" and a "two-stage **LLM** rerank" — the code uses additive score accumulation + classical **MMR**; the LLM only **selects and explains**, never numerically re-ranks.
> - **Hydration:** the advisor output is **ID-first by design** so the client *can* render live catalog data; today that rendering is on the store surfaces and the chat is text/markdown — inline chat cards are the next step, not shipped.
> - The **grounding claims are fully code-backed**; these three are the spots where the prose runs ahead of the build. Own them plainly.

### 6 · Functionality 1 — the advisor *(video)*
> The first feature is the advisor itself. It's reactive — it opens on a click and never interrupts. You ask about whatever product you're viewing, and it answers in text, grounded in that product's real data through five read-only database tools. Watch how, when I move to a different product, the next question is about that one — the answer always tracks what you're actually looking at, and it never guesses a number. *(Code: `ai/tools.ts`, `ai/advisor.ts`.)*

### 7 · Functionality 2 — context *(video)*
> The second feature is what makes those answers personal — the context. On every single request, the advisor's context is rebuilt from your live session: the product you're viewing, its verified review themes, your cart, and your recently-viewed items. It's assembled fresh each time and never cached. So the answer is grounded in your real session, not a generic reply. *(Code: `assembleContext` in `ai/advisor.ts:12-114`, called on every request.)*
>
> *Honest note:* the behavior signals — dwell, scroll — drive the reactive nudges; the advisor context itself is the session/navigation state, not the raw signals.

### 8 · Functionality 3 — review grounding
> The third feature is the review pipeline. A nightly job reads every product's full review corpus and extracts themes, each with a real count. The key part is conflict surfacing: instead of "people like the fit", it says "11 find it secure, 5 say it works loose". And every theme is embedding-verified against the actual review text before it's stored — cosine over 0.35, at least two matching reviews — and that same vector check is reused as the advisor's theme-fidelity validator. *(Code: `reviewSummaries.ts:127-162`.)*

### 9 · Results — the ablation
> Does the grounding actually matter? I ran an ablation — the same model, the same 34 questions, but with the catalog tools removed, answering from memory. A "specific claim" is a concrete price or rating written in the answer. Ungrounded, it made twice as many — 162 versus 83 — and two-thirds didn't match the store, versus just under half when grounded; factuality dropped from 0.76 to 0.53.
>
> *(Say out loud, not on the slide:)* one more finding — the LLM judges actually **preferred** the fabricating version, because a confident, specific-sounding answer reads better. That's exactly why my trust signal comes from database checks, not from another AI's opinion.

### 10 · Results — the sweep
> Across the full eight-configuration sweep, the headline is that the cheapest model won — Gemini Flash-Lite, the best composite score at three-hundredths of a cent per query and a 4.2-second p95. More reasoning was uniformly worse; the big model at high reasoning was my worst and slowest config. And grounding held everywhere — groundedness above 0.89 for all eight. The takeaway is the thesis's central claim: trustworthy AI shopping is a problem of integration discipline, not raw model capability.

### 11 · Conclusions
> To conclude — the contribution isn't a new algorithm; it's an integration architecture plus an honest evaluation against documented production failures, at a scale a bachelor thesis can actually defend. The grounding is structural and measured, and the cheaper model often wins. The honest limits: no human-subject study yet, no offline-IR baseline, and a small seeded catalog. The most valuable next step is a within-subjects user study on trust and purchase confidence.

### 12 · Demo
> *(One word on screen. This is the handoff into the live app — keep it to a single line, then switch to the browser.)*
> And that's the architecture. Rather than tell you it works, let me show you — this is Zalem, running live.

### 13 · Thank you
> *(Return to this slide after the demo and your highlight video, to open Q&A.)*
> Thank you. I'm happy to take your questions.

---

## After the slides — live demo
Per the examiner's guidance the app demo must be **live**, not recorded. Have accounts/profiles already signed in, warm up the Convex deployment beforehand, and walk through: a product page → open the advisor → ask a grounded question → switch product → ask again → show a review summary with its conflict view → (optionally) the homepage rails. Discuss the *why* behind each implementation decision as you go. Keep your own 1–2 min highlight video as a fallback.

## Q&A
Full prepared answers (state-of-the-art comparison, design patterns, input validation, testing, the "how many parameters / overfitting / layers" reframes, false-positive handling, and the thesis-specific questions) are in **`research/qa-prep.md`**.
