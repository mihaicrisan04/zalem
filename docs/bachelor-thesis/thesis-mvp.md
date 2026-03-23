# thesis-safe MVP

how to keep `zalem` inside a scope that is strong enough for a bachelor thesis without turning it into an endless product build.

---

## the rule

the MVP should be the **smallest version of the system that can answer the thesis question**.

not the smallest version of the product.

that is the difference.

---

## thesis-safe MVP statement

build:

> a baseline e-commerce prototype with classical recommendations, review summarization, and a reactive-first AI advisor with comparison support, then evaluate whether these features improve usefulness and trust without feeling intrusive.

if a feature does not help answer that, it is probably not MVP.

---

## must-build

### 1. baseline store

minimum pages:

- home
- category/search results
- product detail
- cart

minimum interactions:

- browse
- search
- view product
- add to cart

why it matters:

- enough realism for evaluation
- enough context for recommendations
- enough flow for the advisor to be meaningful

### 2. seeded dataset

minimum:

- products
- categories
- reviews
- orders
- user preferences

why it matters:

- required for recommendation quality
- required for believable demos
- required for evaluation repeatability

### 3. classical recommendation layer

minimum slots:

- frequently bought together
- similar products
- trending
- recommended for you

why it matters:

- establishes the non-AI baseline
- gives the AI layer grounded candidate products

### 4. behavior-aware readiness signals

minimum signals:

- product dwell
- review engagement
- comparison behavior

why it matters:

- needed to support the reactive-first thesis claim

### 5. AI advisor

minimum functionality:

- advisor button
- contextual chips
- user-initiated advice request
- concise explanation + 2-3 suggestions

why it matters:

- this is the experimental condition

### 6. review summarization

minimum functionality:

- AI-generated review summary for products with enough reviews
- grounded structure such as:
  - what buyers like
  - common complaints
  - best for
  - confidence / review count
- visible on the product detail page near or inside the reviews tab

why it matters:

- this is one of the strongest trust-building AI features
- it grounds the assistant in real customer feedback rather than generic model output

### 7. AI-assisted product comparison

minimum functionality:

- user can compare 2-3 products in the same category
- AI generates a concise structured comparison
- comparison highlights tradeoffs, not just "best product"

why it matters:

- comparison is one of the highest-value shopping assistance tasks
- it directly supports the thesis angle of AI as decision support, not just recommendation

### 8. evaluation instrumentation

minimum:

- recommender metrics
- latency measurements
- token usage / rough cost
- user-study questionnaire

why it matters:

- without this, it is not a strong thesis

---

## should-build

these improve the thesis, but are not core MVP:

- favorites
- order history
- thumbs up/down feedback

---

## cut first if time is tight

cut these before you cut evaluation:

- polished checkout flow
- extra account pages
- post-purchase recommendation emails
- eye tracking
- heatmaps
- advanced analytics dashboard
- marketplace realism
- highly optimized scale work you cannot empirically demonstrate

---

## comparison conditions

the cleanest thesis MVP supports these conditions:

### condition A — baseline

- store
- classical recommendations
- no AI advisor

### condition B — thesis condition

- store
- classical recommendations
- reactive-first AI advisor
- review summarization
- AI-assisted product comparison

### optional condition C — stretch goal

- store
- classical recommendations
- proactive AI advisor

if you only implement A and B, that is already fine.

---

## recommended final MVP scope

### pages

- home
- category/search
- product detail
- cart

### backend

- products
- categories
- reviews
- orders
- user preferences
- recommendation queries
- behavior sessions

### AI

- one advisor surface
- one model path
- one compact explanation format
- review summarization
- AI-assisted product comparison

### evaluation

- offline recommendation metrics
- latency/cost table
- small user study

that is enough.

---

## what not to overbuild

common trap:

- adding many commerce features because they feel product-complete

better move:

- add one more chart, one better comparison, one better measurement

for thesis value:

- one extra evaluation result is worth more than three extra UI screens

---

## realistic thesis execution plan

### stage 1

- finish the baseline store
- implement seed data
- implement recommendation slots

deliverable:

- a usable non-AI baseline

### stage 2

- add behavior tracking
- add readiness signals
- add AI advisor
- add review summarization
- add AI-assisted product comparison

deliverable:

- the thesis system

### stage 3

- measure recommendation quality
- measure latency and cost
- prepare user study tasks

deliverable:

- evaluation-ready system

### stage 4

- run study
- analyze results
- write thesis

deliverable:

- actual thesis evidence

---

## green / yellow / red scope check

### green

- baseline store
- recommender
- reactive-first advisor
- review summarization
- AI-assisted product comparison
- one user study
- latency and cost measurements

### yellow

- favorites and order history

### red

- many optional AI surfaces
- too many user states
- eye tracking experiments
- large-scale infra work
- trying to make the product startup-ready before thesis-ready

---

## one-line recommendation

for the thesis:

> stop when the system is good enough to compare baseline vs AI-assisted shopping in a measured and defensible way.
