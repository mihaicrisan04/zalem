# references

papers, studies, engineering blogs, and market research used to inform the zalem project. organized by category.

---

## academic papers

| #   | title                                                                                                                                                            | authors / venue                        | year | relevance                                                                                |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---- | ---------------------------------------------------------------------------------------- |
| 1   | [No Clicks, No Problem: Using Cursor Movements to Understand and Improve Search](https://jeffhuang.com/papers/CursorBehavior_CHI11.pdf)                          | Huang et al. — CHI 2011                | 2011 | cursor hover correlates with relevance better than CTR — validates our behavior tracking |
| 2   | [Learning Efficient Representations of Mouse Movements to Predict User Attention](https://arxiv.org/abs/2006.01644)                                              | Arapakis & Leiva — SIGIR 2020          | 2020 | neural nets on cursor data predict attention — supports dwell/hover tracking             |
| 3   | [Actions Speak Louder than Words: Trillion-Parameter Sequential Transducers for Generative Recommendations](https://arxiv.org/pdf/2402.17152)                    | Meta — arXiv                           | 2024 | HSTU architecture adopted by Shopify — state of the art in generative recommendations    |
| 4   | [Enhancing UX Evaluation Through Collaboration with Conversational AI: Effects of Proactive Dialogue and Timing](https://dl.acm.org/doi/10.1145/3613904.3642168) | CHI 2024                               | 2024 | AI suggestions after a pause > preemptive — directly informs reactive-first model        |
| 5   | [A Survey on User Behavior Modeling in Recommender Systems](https://www.ijcai.org/proceedings/2023/0746.pdf)                                                     | IJCAI 2023                             | 2023 | how behavior signals feed into recommendations                                           |
| 6   | [Large Language Model Enhanced Recommender Systems: A Survey](https://arxiv.org/abs/2412.13432)                                                                  | arXiv                                  | 2024 | categorizes LLM+RecSys approaches: knowledge, interaction, model enhancement             |
| 7   | A Survey on Session-based Recommender Systems                                                                                                                    | Wang et al. — ACM Computing Surveys    | 2021 | foundational survey on session-based recommendations                                     |
| 8   | [A Comprehensive Review of Recommender Systems](https://arxiv.org/abs/2407.13699)                                                                                | arXiv                                  | 2024 | covers context-aware, review-based, and fairness-aware systems                           |
| 9   | LLM4Rec: A Comprehensive Survey                                                                                                                                  | Future Internet journal                | 2025 | reviews 150+ papers on LLMs for recommendations (2018-2024)                              |
| 10  | [Quantifying Attention via Dwell Time and Engagement](https://arxiv.org/pdf/2209.10464)                                                                          | arXiv                                  | 2022 | dwell time as an engagement signal — supports composite interest score                   |
| 11  | CoLLM: Integrating Collaborative Embeddings into LLMs for Recommendation                                                                                         | TKDE                                   | 2025 | combining collaborative filtering with LLM reasoning                                     |
| 12  | [Enabling Explainable Recommendation with LLM-powered Knowledge Graph](https://arxiv.org/abs/2412.01837)                                                         | arXiv                                  | 2024 | natural language explanations for recommendations                                        |
| 13  | [The Application of Large Language Models in Recommendation Systems](https://arxiv.org/abs/2501.02178)                                                           | arXiv                                  | 2025 | general survey on LLMs in recommendation systems                                         |
| 14  | [Proactive vs Reactive Personalization](https://www.sciencedirect.com/science/article/abs/pii/S1071581918301824)                                                 | Int. Journal of Human-Computer Studies | —    | when proactive personalization helps vs harms — informs hybrid interaction model         |
| 15  | [Consumer Resistance to AI Chatbots](https://www.emerald.com/sjme/article/doi/10.1108/SJME-07-2024-0187/)                                                        | Spanish Journal of Marketing (Emerald) | —    | why consumers resist AI chatbots — informs trust-building design                         |

---

## engineering blogs & case studies

| #   | title                                                                                                                                                          | author                | relevance                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------- |
| 1   | [The Generative Recommender Behind Shopify's Commerce Engine](https://shopify.engineering/generative-recommendations)                                          | Shopify Engineering   | how Shopify adopted HSTU for production recommendations                     |
| 2   | [Improving Recommendation Systems in the Age of LLMs](https://eugeneyan.com/writing/recsys-llm/)                                                               | Eugene Yan            | practical guide on LLM + traditional RecSys integration                     |
| 3   | [Using LLMs to Summarize User Sessions](https://www.elastic.co/security-labs/using-llms-to-summarize-user-sessions)                                            | Elastic Security Labs | aggregating raw behavior before sending to LLM — context assembly pattern   |
| 4   | [Cutting Through the Noise: Smarter Context Management for LLMs](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)                    | JetBrains Research    | efficient LLM context management — token budget optimization                |
| 5   | [USER-LLM: Efficient LLM Contextualization with User Embeddings](https://research.google/blog/user-llm-efficient-llm-contextualization-with-user-embeddings/)  | Google Research       | encoding user behavior into embeddings for LLM context                      |
| 6   | [Building Production-Ready Agentic Systems](https://shopify.engineering/building-production-ready-agentic-systems)                                             | Shopify Engineering   | patterns for deploying agentic AI in production e-commerce                  |
| 7   | [Amazon Rufus UX Review](https://blog.alby.com/amazons-new-ai-shopping-assistant-rufus-ux-review)                                                              | Alby Blog             | UX analysis of Amazon's AI shopping assistant                               |
| 8   | [The Future of AI in E-commerce: 40 Statistics](https://www.hellorep.ai/blog/the-future-of-ai-in-ecommerce-40-statistics-on-conversational-ai-agents-for-2025) | HelloRep / Rep AI     | source for 4x conversion lift (12.3% vs 3.1%), 64% new customer acquisition |

---

## UX research

| #   | title                                                                                                                                                            | author                   | relevance                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| 1   | [Designing Agentic AI: Practical UX Patterns](https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/)                              | Smashing Magazine (2026) | UX patterns for agentic AI — advisor panel and question chip design |
| 2   | [Design is All About Good Timing](https://www.smashingmagazine.com/2022/03/design-is-all-about-good-timing/)                                                     | Smashing Magazine (2022) | when to show UI interventions — trigger timing and cooldowns        |
| 3   | [Guide to E-commerce Recommendation Engines](https://redis.io/blog/ecommerce-product-recommendation-engine/)                                                     | Redis                    | recommendation engine architecture for e-commerce                   |
| 4   | [ICO Early Views on Agentic AI and Data Protection](https://www.insideprivacy.com/artificial-intelligence/ico-shares-early-views-on-agentic-ai-data-protection/) | Inside Privacy           | regulatory perspective on data protection for agentic AI            |

---

## industry research & market reports

| #   | title / source                                                                                                                                                                                 | key data                                                            | relevance                                              |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | [AI Shopping Assistant Market Report](https://www.insightaceanalytic.com/report/ai-shopping-assistant-market/3071) — InsightAce Analytic                                                       | $4.33B (2025) → $46.76B (2035), 27% CAGR                            | market sizing for business case                        |
| 2   | [Agentic Commerce Market Impact Outlook](https://www.morganstanley.com/insights/articles/agentic-commerce-market-impact-outlook) — Morgan Stanley                                              | half of online shoppers will use AI agents by 2030, 25% of spending | future market trajectory                               |
| 3   | [Amazon Rufus: $12B in Incremental Sales](https://ppc.land/amazons-ai-shopping-assistant-drove-12-billion-in-sales-for-2025/) — PPC Land                                                       | 300M users, $12B incremental sales, 60% higher purchase completion  | benchmark for AI assistant ROI                         |
| 4   | [55% Don't Trust AI Chatbot Recommendations](https://www.retailmediabreakfastclub.com/55-of-consumers-say-they-dont-trust-ai-shopping-chatbots-recommendations/) — Retail Media Breakfast Club | 55% distrust, only 16% regular users despite 71% deployment         | trust gap data — critical for UX decisions             |
| 5   | [42% Feel AI is an Upsell Tool](https://www.francescatabor.com/articles/2025/6/20/ai-powered-shopping-assistants-challenges-trends-and-kpis) — Francesca Tabor                                 | 42% perceive AI as upsell, not advisor                              | why "advisor not salesperson" positioning matters      |
| 6   | [97% Retailer AI Adoption](https://ecomposer.io/blogs/ecommerce/ai-in-ecommerce-statistics) — EComposer                                                                                        | 97% implemented or developing AI                                    | competitive baseline — not having AI is a disadvantage |
| 7   | [AI Shopping Behavior Data](https://digiday.com/marketing/how-consumers-are-using-ai-to-shop-in-2025-by-the-numbers/) — Digiday                                                                | 80% validate after AI session, 47% want review summarization        | shapes feature prioritization                          |
| 8   | [Shopify AI Orders Up 15x](https://www.techtic.com/blog/shopify-winter-2026-editions-ai-commerce/) — Techtic                                                                                   | 15x growth since Jan 2025                                           | growth trajectory for AI commerce                      |
| 9   | [Conversational Commerce: $290B in 2025](https://neuwark.com/blog/conversational-commerce-2026-ai-replacing-shopping-cart) — Neuwark                                                           | up from $41B in 2021                                                | market context                                         |
| 10  | [Rufus on pace for $10B](https://fortune.com/2025/11/02/amazon-rufus-ai-shopping-assistant-chatbot-10-billion-sales-monetization/) — Fortune                                                   | $10B pace, attribution model details                                | Rufus financial trajectory                             |
| 11  | [OpenAI agentic shopping](https://www.cnbc.com/2026/03/20/open-ai-agentic-shopping-etsy-shopify-walmart-amazon.html) — CNBC                                                                    | OpenAI building shopping into ChatGPT with Shopify/Walmart          | competitive landscape                                  |

---

## Amazon Rufus — engineering & architecture

| #   | title / source                                                                                                                                                                                                                                               | key data                                                             | relevance                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------ |
| 1   | [Technology behind Rufus](https://www.amazon.science/blog/the-technology-behind-amazons-genai-powered-shopping-assistant-rufus) — Amazon Science                                                                                                             | query planner, model router, multi-source RAG, streaming + hydration | core architecture reference          |
| 2   | [Scaling Rufus with 80K chips for Prime Day](https://aws.amazon.com/blogs/machine-learning/scaling-rufus-the-amazon-generative-ai-powered-conversational-shopping-assistant-with-over-80000-aws-inferentia-and-aws-trainium-chips-for-prime-day/) — AWS Blog | 3M tokens/min, P99 <1s TTFT, infrastructure details                  | scale reference                      |
| 3   | [Rufus on Bedrock](https://aws.amazon.com/blogs/machine-learning/how-rufus-scales-conversational-shopping-experiences-to-millions-of-amazon-customers-with-amazon-bedrock/) — AWS Blog                                                                       | migration to managed serving, 6x dev velocity                        | managed AI infrastructure patterns   |
| 4   | [Parallel decoding for Prime Day](https://aws.amazon.com/blogs/machine-learning/how-rufus-doubled-their-inference-speed-and-handled-prime-day-traffic-with-aws-ai-chips-and-parallel-decoding/) — AWS Blog                                                   | 2x speed via speculative decoding                                    | inference optimization               |
| 5   | [How We Built Rufus](https://spectrum.ieee.org/amazon-rufus) — IEEE Spectrum                                                                                                                                                                                 | engineering overview from Trishul Chilimbi                           | architecture decisions and tradeoffs |
| 6   | [COSMO Knowledge Graphs](https://www.amazon.science/blog/building-commonsense-knowledge-graphs-to-aid-product-recommendation) — Amazon Science                                                                                                               | LLM-built commonsense knowledge graph, 60% relevance improvement     | product enrichment inspiration       |
| 7   | [Rufus Under the Hood](https://dejan.ai/blog/rufus/) — Dejan.ai                                                                                                                                                                                              | independent architecture analysis                                    | third-party technical teardown       |
| 8   | [Scaling Rufus to 250M Users](https://www.zenml.io/llmops-database/scaling-an-ai-powered-conversational-shopping-assistant-to-250-million-users) — ZenML                                                                                                     | MLOps perspective                                                    | deployment patterns                  |

## Amazon Rufus — accuracy & criticism

| #   | title / source                                                                                                                                      | key data                                                             | relevance                                        |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------ |
| 1   | [Rufus is often wrong](https://www.consumeraffairs.com/news/amazons-ai-shopping-assistant-rufus-is-often-wrong-110724.html) — ConsumerAffairs       | 32% accuracy, 83% self-serving                                       | accuracy benchmark we should beat                |
| 2   | [Amazon's Shopping AI Is Confidently Wrong](https://www.marketplacepulse.com/articles/amazons-shopping-ai-is-confidently-wrong) — Marketplace Pulse | 28% price hallucination, fabricated specs                            | validates our hydration-over-generation approach |
| 3   | [Bad Rufus: Amazon Chatbot Gone Wrong](https://www.lasso.security/blog/amazon-chatbot-gone-wrong) — Lasso Security                                  | security and trust issues                                            | cautionary tales for system prompt design        |
| 4   | [Rufus Patent Blueprint](https://sellersessions.com/rufus-the-blueprint/) — Seller Sessions                                                         | semantic similarity model, click training data, visual label tagging | patent analysis                                  |

## Amazon Rufus — additional academic papers

| #   | title                                                                                           | venue                   | relevance                                    |
| --- | ----------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------- |
| 1   | [COOKIE: Conversational Recommendation over Knowledge Graphs](https://arxiv.org/abs/2008.09237) | arXiv                   | conversational recommendation on Amazon data |
| 2   | G-Refer: Graph Retrieval-Augmented LLMs for Explainable Recommendation                          | ACM Web Conference 2025 | graph RAG for explainable recs               |
| 3   | [GNN for Product Recommendation on Amazon Co-purchase Graph](https://arxiv.org/abs/2508.14059)  | arXiv                   | LightGCN, GraphSAGE, GAT evaluation          |

---

## key statistics summary

these numbers come up repeatedly across the docs and inform major design decisions:

| stat                             | value                                                              | source             | how it shaped our plan                                   |
| -------------------------------- | ------------------------------------------------------------------ | ------------------ | -------------------------------------------------------- |
| AI-engaged conversion rate       | 12.3% vs 3.1% baseline (4x)                                        | HelloRep           | justifies the investment in AI integration               |
| consumer AI distrust             | 41-55% don't trust AI shopping advice                              | YouGov, RMBC       | drove the switch from proactive to reactive-first model  |
| shoppers who feel AI = upsell    | 42%                                                                | Francesca Tabor    | drove the "advisor not salesperson" system prompt design |
| queries about product validation | 70%+                                                               | HelloRep           | AI should help decide, not help buy                      |
| want review summarization        | 47%                                                                | Digiday            | added review summarization as a distinct feature         |
| want comparison help             | 56%                                                                | YouGov             | added "compare mode" as a distinct feature               |
| Amazon recommendation revenue    | 35% (~$70B/yr)                                                     | various            | benchmark for recommendation system value                |
| AI assistant market CAGR         | 27% through 2035                                                   | InsightAce         | market tailwind for the project                          |
| Rufus purchase completion lift   | 60% higher                                                         | Amazon             | benchmark for engaged-user conversion lift               |
| cart recovery via AI chat        | 35% vs 5-15% email                                                 | industry aggregate | justifies cart cross-sell as an LLM-powered slot         |
| Rufus accuracy                   | 32% (matching "best products")                                     | ConsumerAffairs    | our opportunity — beat this with output validation       |
| Rufus price hallucination        | 28% of prices are wrong                                            | Marketplace Pulse  | never let LLM generate prices — hydrate from live data   |
| Rufus self-serving bias          | 83% recommend Amazon-owned products                                | ConsumerAffairs    | cautionary tale for "advisor not salesperson"            |
| COSMO relevance improvement      | 60% macro F1 improvement                                           | Amazon Science     | product enrichment with implicit use cases pays off      |
| Rufus feature priority           | reactive first, proactive ("Help Me Decide") added 10 months later | Amazon timeline    | validates reactive-first approach                        |
