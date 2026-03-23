# titles and abstracts

final title candidates and abstract drafts for the current `zalem` direction.

---

## option 1

### title

`A Reactive-First AI Shopping Advisor: Combining Recommender Systems, Behavior Signals, and LLM Explanations`

### why this title is strong

- sounds modern
- makes the thesis argument clear
- emphasizes architecture and HCI, not just "AI"

### abstract

online shopping systems increasingly integrate large language models to support product discovery and decision-making. however, many AI shopping assistants are intrusive, poorly timed, or perceived as upselling tools rather than genuine advisors. this thesis presents the design, implementation, and evaluation of a reactive-first AI shopping advisor for e-commerce. the proposed system combines a classical recommendation layer based on co-occurrence, content similarity, and personalized ranking with a behavior-aware readiness model and an LLM-based explanation layer. instead of proactively interrupting the user, the system uses lightweight browsing signals to infer when help may be useful and only generates AI advice when the user explicitly engages.

the system is implemented as a full-stack prototype with a simulated e-commerce store, a seeded product and order dataset, a recommendation backend, and an interactive advisor interface. evaluation is performed at three levels: recommendation quality, system performance, and user perception. offline recommender metrics are used to assess the baseline recommendation layer, while latency and token-based cost measurements capture the efficiency of the AI-assisted pipeline. a structured user evaluation compares the baseline shopping experience with the reactive-first AI-assisted version in terms of perceived usefulness, trust, intrusiveness, and purchase confidence.

the thesis aims to show that hybrid architectures can deliver useful and explainable shopping assistance while avoiding the drawbacks of overly proactive AI interaction. the results contribute practical guidance for building trustworthy, non-intrusive AI assistants in consumer-facing systems.

---

## option 2

### title

`Design and Evaluation of a Trustworthy AI Shopping Assistant for E-Commerce`

### why this title is strong

- broad enough to sound academic
- simple and easy for a committee to understand
- highlights evaluation, which strengthens the thesis

### abstract

large language models are increasingly used in consumer applications, including e-commerce, where they promise personalized guidance, product explanations, and conversational support. despite this potential, many AI shopping assistants struggle with trust, transparency, and appropriate timing. this thesis investigates how an AI shopping assistant can be designed to be useful without becoming intrusive. the proposed system is a trustworthy shopping assistant built on top of a classical recommendation backbone, lightweight user-behavior signals, and an LLM-based explanation layer.

the implementation includes an e-commerce prototype with product browsing, search, cart functionality, recommendation slots, review summarization, and an advisor interface for product comparison and decision support. the recommendation layer combines classical methods such as co-occurrence and content-based similarity, while the assistant generates natural-language explanations, summarizes customer reviews, and compares similar products in a structured way. the interaction model is reactive-first: the system may indicate that advice is available, but the user must actively request it. this design is intended to improve user trust and reduce unnecessary AI calls.

the thesis evaluates the system through offline recommendation metrics, runtime and cost measurements, and a small user study comparing shopping with and without AI assistance. the main objective is to assess whether review-grounded, user-initiated AI support can improve shopping confidence, comparison quality, and perceived usefulness while preserving a sense of control. the work contributes a practical architecture and design recommendations for trustworthy AI integration in e-commerce systems.

---

## option 3

### title

`Behavior-Aware Explainable Recommendations with Large Language Models in E-Commerce`

### why this title is strong

- sounds more technical
- emphasizes explainability and behavior signals
- best if you want stronger CS/system flavor

### abstract

recommendation systems are a central component of modern e-commerce, yet their outputs are often opaque and poorly aligned with user intent in real time. large language models offer new opportunities for generating natural-language recommendation explanations, but practical integration raises concerns around trust, latency, cost, and interaction design. this thesis proposes a behavior-aware recommendation architecture that combines classical recommender techniques with LLM-generated explanations in an e-commerce setting.

the system uses a two-stage pipeline. first, a recommendation backend produces candidate products using co-occurrence analysis, content-based similarity, and lightweight personalization. second, an LLM layer reranks and explains selected candidates using contextual information about the current product, the user profile, and recent browsing behavior. rather than relying on fully proactive intervention, the system uses readiness signals derived from user behavior to surface optional assistance in a reactive-first interface.

to evaluate the approach, the thesis measures recommendation quality, response latency, token cost, and user-centered outcomes such as usefulness, trust, and perceived intrusiveness. the results are intended to show how behavior-aware and explainable recommendation systems can improve the user experience while remaining technically practical. the thesis contributes a system design, an implementation prototype, and an evaluation framework for human-centered LLM integration in recommendation systems.

---

## best recommendation

if you want the strongest overall option, choose:

`A Reactive-First AI Shopping Advisor: Combining Recommender Systems, Behavior Signals, and LLM Explanations`

if you want the safest and most academic-sounding option, choose:

`Design and Evaluation of a Trustworthy AI Shopping Assistant for E-Commerce`

if you want the most technical/system-oriented option, choose:

`Behavior-Aware Explainable Recommendations with Large Language Models in E-Commerce`

---

## my pick

if i were submitting this thesis, i would pick:

`Design and Evaluation of a Trustworthy AI Shopping Assistant for E-Commerce`

reason:

- very easy to understand
- sounds serious
- gives you room to discuss trust, architecture, recommendations, and evaluation without overcommitting the title to one narrow mechanism
