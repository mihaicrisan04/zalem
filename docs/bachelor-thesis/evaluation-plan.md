# evaluation plan

how to evaluate `zalem` as a bachelor thesis artifact, with special focus on:

- reactive-first AI assistance
- review summarization
- AI-assisted product comparison

this file is the operational version of the evaluation sections referenced in the other thesis docs.

---

## evaluation goals

the evaluation should answer four things:

1. is the recommendation backbone technically meaningful?
2. does the AI layer improve perceived usefulness and trust?
3. do review summaries and AI-assisted comparison actually help people decide?
4. is the system practical in terms of latency and cost?

---

## core evaluation claim

the main claim to test is:

> a reactive-first AI shopping assistant grounded in review summarization and structured product comparison improves decision support without becoming overly intrusive.

---

## evaluation structure

the evaluation should have three layers:

### 1. offline recommender evaluation

measures the quality of the non-AI recommendation backbone.

### 2. system evaluation

measures performance, latency, and cost.

### 3. user evaluation

measures perceived usefulness, trust, intrusiveness, and decision confidence.

---

## 1. offline recommender evaluation

### purpose

prove that the classical recommendation layer is not arbitrary.

### setup

use seeded orders and hold out a portion of interactions or purchased items for testing.

simple protocol:

1. generate seed data
2. use most of the orders as historical data
3. hide one item from a held-out portion of orders
4. check whether the recommender surfaces that hidden item in the top results

### metrics

- `Hit Rate@5`
- `NDCG@10`
- catalog coverage
- diversity
- popularity bias

### what to report

- performance of frequently bought together
- performance of similar products
- performance of personalized recommendations
- short discussion of strengths and weaknesses

### thesis value

this establishes a proper non-AI baseline. without this, the LLM layer has nothing defensible to stand on.

---

## 2. system evaluation

### purpose

show that the design is practical, not just conceptually nice.

### measurements

#### recommendation performance

- p50 recommendation query latency
- p95 recommendation query latency

#### AI advice performance

- p50 LLM response latency
- p95 LLM response latency
- token usage per advice request
- estimated cost per 100 advice requests

#### review summarization performance

- batch generation time per 100 products
- average token cost per summarized product
- cache lifetime / recomputation strategy

#### comparison performance

- p50 comparison generation latency
- p95 comparison generation latency
- token usage per comparison request

### what to report

use a simple table:

| feature | p50 latency | p95 latency | avg tokens | estimated cost |
|---------|-------------|-------------|------------|----------------|
| recommendations | ... | ... | — | — |
| advisor reply | ... | ... | ... | ... |
| review summary batch | ... | ... | ... | ... |
| comparison | ... | ... | ... | ... |

### thesis value

this justifies the hybrid architecture and shows that your design decisions are grounded in engineering tradeoffs.

---

## 3. user evaluation

### purpose

this is the most important part for your thesis claim.

you want evidence that the system helps users:

- trust the assistance more
- feel less interrupted
- understand products better
- compare products more confidently

### participant count

for a bachelor thesis, a realistic target is:

- `8-15` participants

this is enough for a structured comparative study, especially if paired with system metrics and offline recommender metrics.

### participant profile

prefer people who are comfortable shopping online:

- students
- friends/peers who shop online regularly
- optionally a mix of technical and non-technical users

record:

- age bracket
- frequency of online shopping
- prior use of AI assistants
- familiarity with e-commerce platforms

---

## experimental conditions

### condition A — baseline

- store with classical recommendations
- no AI advisor
- no review summarization
- no AI-assisted comparison

### condition B — AI-assisted system

- store with classical recommendations
- reactive-first AI advisor
- AI review summaries
- AI-assisted comparison

### optional condition C — proactive variant

- store with proactive auto-triggering or more intrusive AI behavior

only include condition C if time allows. the thesis is already strong with just A vs B.

---

## tasks for participants

design tasks that directly exercise the thesis features.

### task 1 — choose a product from search

example:

- "find a wireless keyboard suitable for daily work within a mid-range budget"

purpose:

- test baseline browsing + recommendations

### task 2 — use review summaries

example:

- "you are unsure about product quality. use the system to understand what buyers like and dislike about this product"

purpose:

- test whether AI review summaries improve confidence and reduce information overload

### task 3 — compare similar products

example:

- "choose between these two or three similar products and explain why you would pick one"

purpose:

- test whether AI-assisted comparison reduces decision difficulty

### task 4 — optional advisor use

example:

- "use the advisor only if you feel it would help you decide"

purpose:

- test the reactive-first interaction model and whether users actually want to engage

---

## what to measure in the user study

### primary outcomes

- perceived usefulness
- trust
- perceived intrusiveness
- purchase confidence

### feature-specific outcomes

- usefulness of review summaries
- trust in review summaries
- usefulness of AI-assisted comparison
- confidence after comparison
- perceived clarity of product differences

### behavioral observations

- whether users opened the advisor
- whether users used review summaries
- whether users used comparison
- time taken to reach a decision
- whether users changed their decision after AI assistance

---

## sample questionnaire

use a 5-point or 7-point Likert scale. keep it simple.

### general usefulness

1. "The system helped me make a better purchase decision."
2. "The information provided by the system was useful."
3. "The system made the shopping process easier."

### trust

4. "I trusted the information provided by the AI features."
5. "The system felt grounded in real product information."
6. "The AI assistance felt reliable."

### intrusiveness

7. "The AI assistance felt intrusive."  
8. "The timing of the AI assistance felt appropriate."
9. "I felt in control of when the AI helped me."

### review summarization

10. "The review summary helped me understand the product quickly."
11. "The review summary made the product feel more trustworthy."
12. "The review summary highlighted useful strengths and weaknesses."

### comparison

13. "The AI-assisted comparison made it easier to distinguish between similar products."
14. "The comparison helped me understand tradeoffs."
15. "The comparison increased my confidence in choosing one product over another."

### overall

16. "I would want this kind of assistance when shopping online."
17. "I would prefer this system over a store without AI support."

### optional open-ended questions

- "What was the most useful AI feature?"
- "What felt unclear or untrustworthy?"
- "What would you change?"

---

## strongest analysis angles

### 1. baseline vs AI-assisted

compare:

- usefulness
- trust
- intrusiveness
- confidence

this is the core thesis comparison.

### 2. review-summary-specific analysis

compare:

- how quickly users understood product sentiment
- whether summaries increased trust
- whether users still felt the need to read many raw reviews

this is a strong thesis result because it directly supports your review-grounded AI angle.

### 3. comparison-specific analysis

compare:

- perceived difficulty before vs after AI comparison
- clarity of tradeoffs
- final choice confidence

this is strong because comparison is one of the clearest “AI as decision support” use cases.

---

## recommended result presentation

### table 1 — system performance

- latency
- cost
- token usage

### table 2 — offline recommender quality

- hit rate
- ndcg
- diversity
- coverage

### table 3 — user perception

- usefulness
- trust
- intrusiveness
- confidence

### table 4 — feature-specific perception

- review summary usefulness
- review summary trustworthiness
- comparison usefulness
- comparison confidence

### chart ideas

- baseline vs AI-assisted mean scores
- trust vs intrusiveness comparison
- decision confidence before/after comparison
- review summary usefulness distribution

---

## how to discuss the results

### if results are positive

argue that:

- reactive-first timing works
- review-grounded AI improves trust
- structured comparison is genuinely useful
- AI is most valuable for validation and tradeoff analysis, not for generic recommendation

### if results are mixed

that is still fine. you can argue that:

- some features help more than others
- users may trust review summaries more than generic advice
- comparison may be more valuable than open-ended conversational help
- the thesis still contributes useful design guidance

### if results are weak

still valuable if you can explain:

- where trust broke down
- which AI surfaces were not useful
- how grounding and timing need to improve

negative or mixed results are acceptable if analyzed honestly.

---

## additional evaluation angle: accuracy vs production systems

an optional but powerful evaluation angle is comparing your system's factual accuracy against documented Rufus benchmarks:

| metric | Amazon Rufus (documented) | zalem (measured) |
|--------|--------------------------|------------------|
| price accuracy in AI output | 72% (28% hallucination) | target: 100% (hydrated from live data, never generated) |
| recommendation accuracy | 32% | measure via Hit Rate@5 on held-out data |
| review summary theme accuracy | fabricates themes | measure via post-generation theme verification |
| self-serving bias | 83% | 0% (no inventory to favor) |

this isn't a direct apples-to-apples comparison (different scale, different data), but it positions the architectural guardrails as concrete quality improvements. a supervisor will find this compelling because it shows you studied a real system, identified measurable failure modes, and designed solutions.

---

## validity threats

you should explicitly mention:

- small sample size
- synthetic/seeded data instead of real marketplace data
- limited product categories
- novelty effect from AI features
- participant bias if many users are peers or technically literate
- Rufus comparison is architectural, not a controlled experiment (different scale, data, and user base)

this does not weaken the thesis if you state it clearly.

---

## minimum acceptable evaluation

if time becomes tight, do at least this:

1. offline recommender evaluation
2. latency/cost table
3. one A vs B user study
4. questionnaire sections for:
   - trust
   - usefulness
   - intrusiveness
   - review summary usefulness
   - comparison confidence

that is enough for a solid bachelor thesis.

---

## best practical recommendation

if you want the highest thesis payoff for the least added complexity:

1. make review summarization strong and grounded
2. make comparison structured and tradeoff-focused
3. keep the advisor reactive-first
4. measure the difference carefully

that combination gives you the best chance of a convincing thesis result.
