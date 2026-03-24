# supervisor package

a supervisor-ready package for presenting `zalem` as a bachelor thesis topic in computer science.

this file is intentionally compact and decision-oriented. it is the best single document to share first with a supervisor.

---

## recommended final title

`Design and Evaluation of a Trustworthy AI Shopping Assistant for E-Commerce`

### why this title

- easy to understand immediately
- sounds academically serious
- leaves room to discuss architecture, trust, recommendations, and evaluation
- avoids sounding like "just an AI demo"

---

## thesis summary

this thesis investigates how an AI shopping assistant can be designed to be useful without becoming intrusive or untrustworthy. the proposed system is a full-stack e-commerce prototype that combines classical recommendation methods, lightweight behavior signals, review-grounded LLM summaries, and AI-assisted product comparison. unlike many proactive AI assistants, the system follows a reactive-first interaction model: it can indicate that assistance is available, but the user must explicitly request advice. the goal is to evaluate whether this design improves perceived usefulness, trust, and decision confidence compared to a baseline shopping experience without AI assistance.

---

## final abstract

large language models are increasingly used in consumer applications, including e-commerce, where they promise personalized guidance, product explanations, and conversational support. despite this potential, production AI shopping assistants — including Amazon's Rufus, the largest such system with over 300 million users — exhibit documented issues with recommendation accuracy, factual hallucination, review misrepresentation, and user-perceived intrusiveness. this thesis investigates how an AI shopping assistant can be designed to address these specific failure modes while remaining useful, trustworthy, and non-intrusive.

the proposed system is built on a classical recommendation backbone combined with lightweight user-behavior signals, review-grounded LLM summaries, and an AI-assisted comparison layer. key architectural decisions include an output validation layer that prevents hallucination of product data, review summaries that explicitly surface conflicting opinions with counts, and a reactive-first interaction model where users control when AI assistance is invoked. the recommendation layer combines co-occurrence and content-based similarity methods, while the LLM layer generates grounded explanations, summarizes customer reviews, and produces structured product comparisons.

the thesis evaluates the system through offline recommendation metrics, runtime and cost measurements, and a small user study comparing shopping with and without AI assistance. the main objective is to assess whether review-grounded, user-initiated AI support can improve shopping confidence, comparison quality, and perceived usefulness while preserving a sense of control. the work contributes a practical architecture, quality guardrails informed by analysis of production systems, and design recommendations for trustworthy AI integration in e-commerce.

---

## problem statement

current AI shopping assistants often have one or more of these issues:

- they interrupt users at the wrong time
- they feel like upselling tools instead of decision-support systems
- they provide generic advice with weak grounding
- they increase complexity and cost without clear measurable benefit

these are not hypothetical concerns. Amazon's Rufus — the largest production AI shopping assistant (300M+ users, ~$12B incremental sales) — demonstrates them concretely:

- **32% recommendation accuracy** (matching actual "best products")
- **28% price hallucination rate** when prices appear in generated text
- **83% self-serving recommendations** (favoring Amazon-owned products)
- review summarization that fabricates themes and hides conflicting opinions
- user complaints about intrusiveness ("Rufus makes me hate shopping on Amazon")

the thesis problem is therefore:

> how can an AI shopping assistant be designed to provide useful, explainable, and timely support while preserving user trust and maintaining acceptable system cost and latency?

specifically, this thesis addresses the documented shortcomings of production systems like Amazon Rufus through architectural guardrails: output validation against live product data, review summaries that surface conflicting opinions with counts, and a reactive-first interaction model that avoids the intrusiveness users report with proactive assistants.

---

## research questions

### primary

1. **RQ1:** does a reactive-first AI advisor improve perceived trust and reduce intrusiveness compared to a shopping experience without AI assistance?
2. **RQ2:** do review-grounded LLM summaries improve the perceived trustworthiness and usefulness of product information?
3. **RQ3:** does AI-assisted comparison improve confidence when choosing between similar products?

### secondary

4. **RQ4:** which lightweight behavior signals are most useful for identifying when assistance may be helpful?
5. **RQ5:** what are the latency and cost tradeoffs of a two-stage recommendation architecture?

---

## hypotheses

### main hypotheses

1. **H1:** users of the reactive-first AI advisor will report higher perceived usefulness than users of the baseline system without AI assistance.
2. **H2:** users of the reactive-first AI advisor will report lower perceived intrusiveness than a proactive auto-triggered assistant design.
3. **H3:** products accompanied by concise AI-generated review summaries will be perceived as more trustworthy and easier to evaluate than products without such summaries.
4. **H4:** AI-assisted comparison between similar products will increase purchase confidence compared to manual comparison without AI support.
5. **H5:** a hybrid architecture using classical recommendation for candidate generation and LLMs for explanation, review summarization, and comparison can remain within acceptable latency and cost bounds for a consumer-facing demo system.

### optional exploratory hypotheses

6. **H6:** review engagement and product dwell time will be stronger readiness indicators than generic browsing time alone.
7. **H7:** user-initiated AI assistance will produce better trust calibration than continuously proactive assistance.

---

## thesis contributions

realistic and defensible contributions for a bachelor thesis:

1. a working e-commerce prototype with a hybrid recommendation architecture
2. a reactive-first AI advisor design for non-intrusive assistance
3. an output validation layer that prevents LLM hallucination of product data (addressing documented 28% hallucination rate in Amazon Rufus)
4. a review-grounded summarization mechanism that explicitly surfaces conflicting opinions (addressing Rufus's most-criticized feature)
5. an AI-assisted comparison flow for similar products
6. a behavior-driven readiness mechanism based on lightweight browsing signals
7. an empirical evaluation of recommendation quality, trust, usefulness, latency, and cost
8. practical design recommendations for trustworthy AI shopping assistance, benchmarked against documented failures of production systems

---

## technical approach

### system architecture

the system uses a two-stage architecture:

1. **classical recommendation layer**
   - co-occurrence for frequently bought together
   - content-based similarity for similar products
   - lightweight personalization for "recommended for you"

2. **LLM explanation layer**
   - takes pre-filtered candidates
   - generates concise explanations and product suggestions
   - produces grounded review summaries for products with enough review data
   - supports structured comparison between 2-3 similar products
   - only runs when the user explicitly engages with the advisor, except for batch review-summary generation

### interaction model

- baseline store remains fully usable without AI
- behavior signals are used only to infer readiness, not to auto-fire advice
- advisor appears as an optional, user-controlled assistance surface

### quality guardrails (informed by Amazon Rufus analysis)

- **output validation layer** — post-generation verification that every productId exists and claimed attributes match the database. the LLM never generates prices, ratings, or specs — these are hydrated from live data
- **review conflict surfacing** — summaries explicitly present divided opinions with counts instead of hiding behind majority sentiment
- **formalized model routing** — different query types route to different models based on complexity/latency/cost tradeoffs

### implementation posture

- artifact-first but evaluation-driven
- full-stack prototype with measurable behavior
- practical engineering choices over theoretical novelty
- architectural decisions benchmarked against documented failures of Amazon Rufus

---

## methodology

### 1. offline recommender evaluation

the classical recommendation layer will be evaluated using held-out seeded order data.

metrics:

- `Hit Rate@5`
- `NDCG@10`
- diversity
- catalog coverage
- popularity bias

purpose:

- show that the non-AI recommendation backbone is technically meaningful

### 2. system evaluation

the system will be instrumented to measure:

- median and p95 latency for recommendation retrieval
- median and p95 latency for AI advice generation
- median and p95 latency for product comparison generation
- review-summary generation cost per product batch
- token usage per advice request
- estimated cost per session / per 100 users

purpose:

- justify architecture decisions
- show practical feasibility

### 3. user evaluation

a small structured user study will compare:

- **condition A:** baseline store with classical recommendations only
- **condition B:** store with reactive-first AI advisor
- **optional condition C:** store with proactive auto-triggered AI advisor

target participant count:

- `8-15` participants is sufficient for a bachelor-level structured evaluation

measures:

- perceived usefulness
- trust
- perceived intrusiveness
- clarity of explanations
- purchase confidence
- usefulness of review summaries
- confidence in AI-assisted comparison

instruments:

- Likert-scale questionnaire
- optional `SUS`
- short qualitative feedback questions

---

## scope boundary

### included in thesis MVP

- home page
- category/search flow
- product detail page
- cart page
- seeded dataset
- classical recommendation slots
- reactive-first advisor
- review summarization
- AI-assisted product comparison
- evaluation instrumentation
- small user study

### excluded or de-prioritized

- startup-level polish
- too many extra commerce features
- extreme scale engineering
- eye tracking / heatmaps unless time remains after evaluation is ready

---

## one-page proposal draft

### working title

`Design and Evaluation of a Trustworthy AI Shopping Assistant for E-Commerce`

### motivation

large language models are increasingly integrated into consumer-facing applications, including e-commerce. however, even the most prominent production systems exhibit serious quality issues. Amazon's Rufus — the largest AI shopping assistant with 300M+ users — has a documented 32% recommendation accuracy rate, a 28% price hallucination rate, and widespread user complaints about intrusiveness and fabricated review themes. these are not edge cases but structural problems arising from architectural choices. this thesis explores whether a more human-centered design, based on reactive-first interaction, output validation, and grounded review summarization, can address these documented failure modes while providing meaningful decision support.

### objective

the objective of this thesis is to design, implement, and evaluate an AI shopping assistant that combines classical recommendation methods, lightweight behavior signals, and LLM-generated explanations. the system will be built as a working e-commerce prototype and studied as a decision-support system rather than as a generic chatbot.

### research questions

1. does a reactive-first AI advisor improve perceived usefulness and trust compared to a baseline shopping system without AI assistance?
2. do LLM-generated explanations improve the perceived usefulness of recommendations generated by classical recommendation methods?
3. what are the latency and cost tradeoffs of this architecture?

### approach

the system will use a two-stage architecture. first, a classical recommendation layer will generate candidate products using co-occurrence and content-based similarity methods. second, an LLM layer will produce concise natural-language explanations for selected recommendations. user behavior signals such as product dwell time and review engagement will be used only to estimate readiness for assistance, while actual advice generation will remain user-initiated.

### evaluation

the thesis will evaluate the system at three levels: recommendation quality, system performance, and user perception. recommendation quality will be measured using offline metrics such as hit rate and ranking quality. system performance will be assessed through latency and token-cost measurements. user perception will be studied through a small structured evaluation comparing a baseline shopping experience with an AI-assisted one.

### expected contribution

the thesis is expected to contribute a practical architecture for trustworthy AI shopping assistance with quality guardrails informed by analysis of production systems, a working prototype, and empirical findings on trust, usefulness, and intrusiveness in LLM-assisted e-commerce interaction.

---

## supervisor talking points

if you are discussing this with a supervisor, the key points to emphasize are:

1. this is **not** just an app build — the app is the artifact, the thesis is the design and evaluation
2. the topic is modern because it addresses trustworthy LLM integration, not just LLM usage
3. the work combines software systems, recommender design, and HCI
4. the scope is realistic for a bachelor thesis because it avoids heavy model training and complex math
5. **the project is benchmarked against Amazon Rufus** — the largest production AI shopping assistant (300M+ users, $12B sales). Rufus has documented accuracy problems (32%), hallucination (28% price errors), and user trust issues. this thesis directly addresses those failure modes with concrete architectural solutions
6. the reactive-first interaction model is backed by academic research (CHI 2024) and validated by Amazon's own feature timeline (they launched reactive-only, added proactive "Help Me Decide" 10 months later)
7. the evaluation plan has three layers (offline metrics, system performance, user study) — stronger than typical bachelor theses that only evaluate one dimension

---

## recommendation

if you want one file to anchor your supervisor conversation, use this one.

then use the rest of the thesis folder for detail:

- `current-direction.md` for framing
- `thesis-mvp.md` for scope control
- `thesis-outline.md` for writing structure
- `titles-and-abstracts.md` for alternatives
