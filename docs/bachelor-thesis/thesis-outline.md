# thesis outline

a practical chapter-by-chapter structure for writing the bachelor thesis around `zalem`.

---

## target structure

### 1. introduction

purpose:

- introduce the problem
- justify relevance
- state research questions and contributions

what to include:

- e-commerce decision overload
- limitations of generic AI shopping assistants
- trust and intrusiveness problems
- why a reactive-first advisor is worth studying
- thesis objectives
- research questions
- thesis contributions

deliverable:

- a clear statement of what was built and what was evaluated

---

### 2. background and related work

purpose:

- show you understand the field
- situate the project academically

what to include:

- classical recommender systems
  - co-occurrence
  - content-based filtering
  - hybrid recommenders
- explainable recommendations
- review summarization for purchase validation
- AI-assisted comparison as a decision-support pattern
- LLMs in recommender systems
- human-AI trust and explainability
- proactive vs reactive AI assistance
- behavior signals as proxies for user intent
- **production AI shopping assistants — Amazon Rufus as a case study:**
  - architecture (multi-model routing, RAG pipeline, streaming + hydration)
  - documented accuracy problems (32% accuracy, 28% price hallucination, review fabrication)
  - user trust issues (83% self-serving, intrusiveness complaints)
  - feature evolution timeline (reactive first, proactive added 10 months later)
  - Amazon's COSMO knowledge graph for product enrichment
  - this section positions the thesis as addressing real, documented production failures, not hypothetical concerns

good ending for this chapter:

> existing systems either focus on recommendation quality or conversational AI, but fewer works address timing, trust, and non-intrusive assistance in a unified practical architecture. production systems like Amazon Rufus demonstrate that even at massive scale, factual accuracy, review grounding, and user trust remain unsolved challenges.

---

### 3. problem definition and requirements

purpose:

- define what exact problem you are solving

what to include:

- system goals
- non-goals
- user-facing requirements
- system requirements
- thesis-specific requirements
  - usefulness
  - low intrusiveness
  - explainability
  - acceptable latency
  - reasonable cost

also define:

- evaluation criteria
- constraints
- assumptions

---

### 4. system design

purpose:

- explain the architecture and justify key decisions

what to include:

- overall architecture
- frontend, backend, recommendation, AI, and evaluation components
- reactive-first interaction model
- why not proactive auto-fire
- recommendation pipeline
  - static candidate generation
  - LLM reranking / explanation
  - review summarization pipeline
  - comparison flow for similar products
- behavior tracking and readiness signals
- auth/session model
- privacy boundary
- Convex-based implementation choices
- data flow diagrams

this chapter should feel like the heart of the engineering contribution.

---

### 5. implementation

purpose:

- describe what was actually built

what to include:

- store prototype
- backend/data layer
- seeded data
- recommendation algorithms
- behavior tracking hooks
- advisor UI
- review-summary UI and generation flow
- comparison UI and comparison generation flow
- LLM integration
- instrumentation for measurements

important:

- do not turn this into a file-by-file changelog
- organize by subsystem, not by commit history

---

### 6. evaluation methodology

purpose:

- define how you will test the thesis claims

split this chapter into 3 parts:

#### 6.1 recommender evaluation

- offline evaluation protocol
- train/test or holdout setup
- metrics:
  - `Hit Rate@5`
  - `NDCG@10`
  - diversity
  - catalog coverage
  - popularity bias

#### 6.2 system evaluation

- latency measurement
- p50 / p95 recommendation time
- p50 / p95 LLM response time
- p50 / p95 comparison generation time
- batch cost of review-summary generation
- token usage
- estimated cost per session

#### 6.3 user evaluation

- participant profile
- number of participants
- study tasks
- comparison conditions
  - baseline recommender only
  - recommender + reactive-first advisor
  - optionally proactive advisor
- questionnaire design
- trust / usefulness / intrusiveness measures
- review-summary usefulness measures
- confidence in AI-assisted comparison

---

### 7. results

purpose:

- present findings clearly

what to include:

- recommender metric results
- latency and cost results
- user-study results
- review-summary usefulness results
- AI-assisted comparison results
- charts and tables
- short interpretation of each result

best practice:

- keep raw facts separate from discussion
- first report, then interpret

---

### 8. discussion

purpose:

- interpret what the results mean

what to include:

- did the reactive-first model help?
- where did explanations help?
- did review-grounded summaries improve trust?
- did AI-assisted comparison reduce decision difficulty?
- where did the system still fail?
- tradeoffs between quality, trust, cost, and complexity
- what surprised you
- validity threats
  - limited participant count
  - synthetic/seeded data
  - bounded domain
  - possible novelty bias

---

### 9. conclusion and future work

purpose:

- close the argument cleanly

what to include:

- recap the problem
- recap the proposed system
- recap the main findings
- practical implications
- future improvements
  - larger-scale evaluation
  - broader product domains

---

## appendix ideas

put these in appendices if needed:

- survey questions
- task instructions for participants
- system prompts
- example outputs
- extra architecture diagrams
- extra metric tables

---

## writing advice

### keep the balance right

good thesis balance:

- `25%` context and literature
- `25%` system design and implementation
- `35%` evaluation and results
- `15%` discussion and conclusion

bad balance:

- `70%` implementation
- `10%` evaluation

### what your supervisor/examiner wants to see

- a clear problem
- a justified approach
- a working artifact
- evidence
- honest limitations

---

## ideal committee takeaway

the final document should make the reader think:

> this student built a modern, relevant system and evaluated it in a technically and academically credible way.
