# current direction for `zalem`

the recommended thesis direction if you keep the current project.

---

## one-sentence thesis version

> design, implementation, and evaluation of a trustworthy, reactive-first AI shopping advisor that combines classical recommender systems, review-grounded LLM explanations, and AI-assisted product comparison.

---

## why this is the right framing

if you pitch `zalem` as:

> an e-commerce app with AI

it will sound too implementation-heavy and too product-like.

if you pitch it as:

> a human-centered AI decision-support system for e-commerce that addresses documented failures of production systems like Amazon Rufus

it becomes a much stronger CS thesis because it now includes:

- system architecture
- recommendation design
- review-grounded explanation design (addressing Rufus's most-criticized feature)
- output validation to prevent hallucination (addressing Rufus's 28% price hallucination rate)
- comparison support for decision-making
- LLM integration strategy
- HCI / trust
- evaluation
- performance and cost tradeoffs
- competitive benchmarking against a real production system ($12B, 300M users)

---

## recommended thesis title direction

best current direction:

1. `A Reactive-First AI Shopping Advisor: Combining Recommender Systems, Behavior Signals, and LLM Explanations`
2. `Design and Evaluation of a Trustworthy AI Shopping Assistant for E-Commerce`
3. `Behavior-Aware Explainable Recommendations with Large Language Models in E-Commerce`

---

## thesis claim

the thesis should defend a claim like this:

> a reactive-first AI advisor can improve perceived usefulness and decision confidence in e-commerce while reducing intrusiveness compared to more proactive AI assistance patterns, especially when its guidance is grounded in customer reviews and structured product comparison.

or:

> a hybrid architecture that combines classical recommendation methods with review-grounded LLM explanation and comparison support can deliver useful shopping assistance at acceptable latency and cost.

---

## best research questions

recommended final set:

1. **RQ1:** does a reactive-first advisor increase trust and reduce intrusiveness compared to proactive AI suggestions?
2. **RQ2:** do review-grounded LLM summaries improve the perceived trustworthiness and usefulness of product information?
3. **RQ3:** does AI-assisted comparison improve user confidence when choosing between similar products?
4. **RQ4:** which lightweight behavior signals are most useful for identifying readiness for assistance?
5. **RQ5:** what are the latency and cost tradeoffs of a two-stage recommendation architecture?

if you need to narrow it down, keep:

1. **RQ1**
2. **RQ2**
3. **RQ3**

that is already enough for a strong bachelor thesis.

---

## recommended scope

### keep

- baseline store
- static recommender
- reactive-first advisor
- review summarization
- AI-assisted product comparison
- behavior-driven readiness signals
- explanation generation
- evaluation

### de-emphasize

- too many store features
- advanced marketplace realism
- extreme scale work you will not actually demonstrate
- experimental extras like eye tracking unless you have clear time and evaluation value

---

## the real academic contribution

for a bachelor thesis, realistic contributions are:

1. a working hybrid recommendation architecture
2. a reactive-first AI interaction model
3. a review-grounded explanation mechanism for purchase validation
4. an AI-assisted comparison flow for similar products
5. a behavior-driven readiness mechanism
6. an evaluation of trust, usefulness, latency, and cost
7. design recommendations for non-intrusive AI shopping systems

that is enough.

you do **not** need to invent a new model.
you do **not** need heavy math.
you do **not** need publishable novelty.

you need:

- a well-defined problem
- a justified design
- a real prototype
- a measured evaluation

---

## biggest risk

the biggest risk is overbuilding the product and underbuilding the thesis.

the failure mode looks like this:

- beautiful UI
- many commerce features
- lots of code
- no strong research question
- weak evaluation

that creates a good portfolio piece but a weaker thesis.

---

## best path forward

if you keep this topic, the smartest move is:

1. lock the thesis framing early
2. trim the product to a thesis-safe MVP
3. define the evaluation before implementation grows too much
4. treat the app as the artifact and the evaluation as the proof

---

## blunt recommendation

yes, keep `zalem` **if** you are excited about it and willing to evaluate it properly.

do **not** keep it if what you really want is just:

- a cool demo
- a startup prototype
- a portfolio app

because then it will drift away from thesis quality.

the right version of `zalem` is not:

> bigger

it is:

> sharper
