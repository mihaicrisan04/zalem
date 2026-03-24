# AI integration plan

the core of the application — LLM-powered shopping assistant with behavior-driven triggers.

---

## corrections to your original plan

a few things the research challenged or refined from our initial assumptions:

### 1. proactive-first is risky — go hybrid instead

your original spec says the AI should proactively suggest when the user dwells, scrolls, etc. the research strongly challenges this:

- **41% of Americans don't trust AI shopping assistants at all**
- **42% of shoppers feel AI implementations are upsell tools**, not genuine assistants
- **55% don't trust AI chatbot recommendations**
- only **16% of consumers regularly use chatbots** despite 71% of companies deploying them

the CHI 2024 paper we referenced earlier + the UX research both point the same direction: **reactive-first with smart proactive signals**. meaning:

- AI is always **available** (subtle indicator, question chips) but rarely **interrupts**
- proactive nudges only at high-confidence moments (exit intent, extended deliberation)
- the user **pulls** information rather than having it **pushed**

this is a meaningful change from the original "trigger when user dwells >3s" approach. we should still track behavior, but use it to **prepare** context, not to auto-fire suggestions.

### 2. the AI should help decide, not help buy

research shows **80% of shoppers visit a retailer to validate decisions after an AI session**. the #1 use case is:

- product validation ("is this right for me?") — 70%+ of queries
- comparison help
- compatibility checking
- review summarization

the AI should be a **knowledgeable advisor**, not a salesperson. this changes the tone of everything — the system prompt, the suggestion UI, the triggers.

### 3. not every recommendation slot needs an LLM

for a store with 10K daily visitors, the realistic call volume is ~18K LLM calls/day if you call on every slot. but most slots work perfectly without one:

| slot                           | needs LLM? | why / why not                                                                                                            |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| frequently bought together     | **no**     | pure co-occurrence, product cards are enough                                                                             |
| similar products               | **no**     | pure content similarity, no explanation needed                                                                           |
| trending / bestsellers         | **no**     | just sort and display                                                                                                    |
| recently viewed                | **no**     | just a list                                                                                                              |
| category sorting               | **no**     | latency-critical, too frequent                                                                                           |
| **personalized homepage hero** | **yes**    | natural language explanation makes it feel personal                                                                      |
| **cart cross-sell**            | **yes**    | user has committed to buying, high-value moment                                                                          |
| **review summarization**       | **yes**    | high-trust explanation surface grounded in actual customer feedback; generated offline in batch rather than on page load |
| **AI-assisted comparison**     | **yes**    | one of the highest-value shopping tasks; structured tradeoff analysis is where LLMs are genuinely useful                 |
| **product detail "advisor"**   | **yes**    | when user opts in or shows deliberation signals                                                                          |
| **conversational assistant**   | **yes**    | user explicitly asks for help                                                                                            |

this means ~30-40% of visitors will trigger an LLM call, not 100%. estimated: **5,000-8,000 calls/day for 10K visitors**.

### 4. output validation is critical (from Rufus research)

Amazon Rufus has a **32% accuracy rate** and **28% price hallucination rate**. the root cause: the LLM generates factual product data (prices, specs, ratings) instead of referencing live data. our architecture should enforce a strict boundary:

- **the LLM never generates factual product data** — it outputs `productId` references that the client hydrates with live Convex data
- **post-generation validation** — after the agent responds, verify every `productId` exists and strip any price/rating/spec claims from free-text output
- **review summary verification** — check that themes claimed in the summary actually appear in the review corpus

this is the single biggest quality advantage we can have over Rufus.

### 5. formalized model routing (from Rufus research)

Amazon uses a real-time model router that selects among multiple models per query. we should formalize this instead of ad-hoc "use Flash-Lite for simple stuff":

| query type                   | model      | thinking level | rationale                               |
| ---------------------------- | ---------- | -------------- | --------------------------------------- |
| review summarization (batch) | Flash-Lite | none           | offline, high volume, simple extraction |
| quick product Q&A            | Flash-Lite | minimal        | fast, cheap, factual lookup             |
| comparison                   | Flash      | medium         | needs reasoning about tradeoffs         |
| personalized advice          | Flash      | medium         | needs context integration               |
| multi-turn conversation      | Flash      | medium         | needs conversation coherence            |
| homepage hero recommendation | Flash-Lite | minimal        | simple re-ranking, speed matters        |

implement as a `selectModel(queryType)` function in `ai.ts`.

### 6. multimodal is not worth it at runtime

sending product images to the LLM at recommendation time adds 40% latency and 5x cost. text attributes contain enough semantic info for re-ranking. **use multimodal offline** to pre-compute visual embeddings and enrich metadata, not at runtime.

---

## LLM selection

### model comparison

| model                 | input $/1M | output $/1M | TTFT       | structured JSON             | verdict                                                     |
| --------------------- | ---------- | ----------- | ---------- | --------------------------- | ----------------------------------------------------------- |
| **Gemini 3 Flash**    | $0.50      | $3.00       | ~350-450ms | native schema enforcement   | **recommended** — best quality/speed/cost for this use case |
| Gemini 3.1 Flash-Lite | $0.25      | $1.50       | ~260-330ms | supported                   | good for high-volume simple slots                           |
| GPT-4o-mini           | $0.15      | $0.60       | ~300-500ms | native JSON mode            | cheapest per-token, no context caching                      |
| Claude Haiku 4.5      | $1.00      | $5.00       | ~600ms     | via tool_use (adds latency) | best reasoning, 3-7x more expensive                         |

### cost per request (3K input, 200 output tokens)

| model                 | cost/request | 8K calls/day | monthly |
| --------------------- | ------------ | ------------ | ------- |
| GPT-4o-mini           | $0.00057     | $4.56        | $137    |
| Gemini 3.1 Flash-Lite | $0.00105     | $8.40        | $252    |
| Gemini 3 Flash        | $0.00210     | $16.80       | $504    |
| Claude Haiku 4.5      | $0.00400     | $32.00       | $960    |

### why Gemini 3 Flash

1. **context caching** — cache system prompt + few-shot examples (90% cost reduction on cached tokens). this is huge for a shopping assistant where the same system prompt and product catalog context is shared across all users
2. **native structured output** — JSON schema enforcement at the API level, >99% compliance. no parsing headaches
3. **configurable thinking** — `thinking_level: "minimal"` for fast re-ranking, "medium" for conversational advice
4. **sub-500ms TTFT** — acceptable for proactive suggestions (user isn't waiting for a chat response)
5. **implicit caching** — Gemini automatically detects repeated prefixes and caches them. zero code changes needed

use **Flash-Lite** for the simple re-ranking slot (homepage hero) where speed matters most. use **full Flash** for conversational assistant where quality matters more.

---

## architecture

### what changed from the original plan

the original plan had triggers firing automatically and scheduling Convex actions. the refined architecture adds a **user interaction layer** — the AI prepares context in the background but waits for user engagement before generating a response.

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Next.js)                         │
│                                                              │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────┐  │
│  │  product UI  │  │  behavior     │  │  AI surface      │  │
│  │  (store)     │  │  tracker      │  │                  │  │
│  │              │  │  (hooks)      │  │  ┌────────────┐  │  │
│  │              │  │               │  │  │ question   │  │  │
│  │              │  │               │  │  │ chips      │  │  │
│  │              │  │               │  │  ├────────────┤  │  │
│  │              │  │               │  │  │ advisor    │  │  │
│  │              │  │               │  │  │ panel      │  │  │
│  │              │  │               │  │  ├────────────┤  │  │
│  │              │  │               │  │  │ subtle     │  │  │
│  │              │  │               │  │  │ indicator  │  │  │
│  │              │  │               │  │  └────────────┘  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────▲─────────┘  │
│         │                 │                    │             │
│         │          ┌──────▼───────┐            │             │
│         │          │  context     │            │             │
│         │          │  builder     │            │             │
│         │          │  (client)    │            │             │
│         │          └──────┬───────┘            │             │
│         │                 │                    │             │
│         │          ┌──────▼───────┐            │             │
│         │          │  readiness   │            │             │
│         │          │  evaluator   │            │             │
│         │          │ (show chips/ │────────────┘             │
│         │          │  indicator)  │                          │
│         │          └──────┬───────┘                          │
└─────────┼─────────────────┼─────────────────────────────────┘
          │                 │
          │          user clicks chip
          │          or opens panel
          │                 │
┌─────────▼─────────────────▼─────────────────────────────────┐
│                    CONVEX BACKEND                             │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  products     │  │  behavior    │  │  @convex-dev/     │  │
│  │  queries      │  │  mutations   │  │  agent            │  │
│  │              │  │              │  │                   │  │
│  │              │  │              │  │  shoppingAdvisor  │  │
│  │              │  │              │  │  (threads, tools, │  │
│  │              │  │              │  │   streaming)      │  │
│  └──────────────┘  └──────┬───────┘  └────────┬──────────┘  │
│                           │                    │             │
│                    ┌──────▼───────┐             │             │
│                    │  context     │─────────────┘             │
│                    │  via agent   │                           │
│                    │  tool calls  │                           │
│                    │              │                           │
│                    │  • product   │                           │
│                    │  • user      │                           │
│                    │  • behavior  │                           │
│                    │  • candidates│                           │
│                    └──────────────┘                           │
│                                                              │
│                    ┌──────────────┐    ┌──────────────────┐   │
│                    │  Gemini      │───▶│  delta streaming  │  │
│                    │  Flash API   │    │  to all clients   │  │
│                    └──────────────┘    └──────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### interaction model: hybrid (reactive-first with smart proactive signals)

**level 1 — passive availability (always on):**

- "Ask advisor" button visible on product detail pages
- contextual question chips based on product type: "Is this good for gaming?", "How does this compare to [similar product]?", "What do other buyers think?"
- question chips are generated from product attributes + reviews, **not from the LLM** (zero cost)

**level 2 — smart readiness indicator (behavior-triggered):**

- when behavior signals suggest deliberation (dwell >5s on product, scrolled reviews, viewed 3+ products in category):
  - show a subtle pulsing indicator on the advisor button
  - show 1-2 contextual chips relevant to the user's behavior pattern
  - **no LLM call yet** — just UI changes based on client-side logic

**level 3 — active engagement (user-initiated):**

- user clicks a chip or opens the advisor sidebar
- **now** fire the Convex action → LLM call
- stream the response into the advisor sidebar
- show product card suggestions alongside the natural language advice

**level 4 — proactive nudge (high-confidence moments only):**

- exit intent detected
- cart abandonment (items in cart, navigating away)
- extended idle on checkout page
- show a non-intrusive slide-in: "Need help deciding? Our advisor noticed you're comparing [X] and [Y]."
- **still requires user click** to trigger the LLM call

---

## context assembly pipeline

### what to send to the LLM

**token budget: 2,200–3,500 tokens total**

| component                         | tokens     | cached?               | content                                                                |
| --------------------------------- | ---------- | --------------------- | ---------------------------------------------------------------------- |
| system prompt + few-shot examples | ~1,000     | **yes** (90% savings) | persona, output schema, 3 examples                                     |
| user context                      | ~200-300   | no                    | purchase history summary, preferences, current cart                    |
| behavior context                  | ~100-150   | no                    | trigger type, dwell time bucket, products viewed, scroll depth         |
| current product                   | ~80-100    | no                    | title, category, price, rating, key attributes, 1-sentence description |
| candidates (15-20 products)       | ~800-1,200 | no                    | compact: {name, category, price, rating, score, source} per product    |
| **output**                        | ~150-250   | —                     | structured JSON: suggestions + message                                 |

### product representation (compact, ~50 tokens each)

```json
{
  "id": "abc",
  "name": "Wireless Mouse M720",
  "cat": "peripherals",
  "price": 45,
  "rating": 4.3,
  "reviews": 89,
  "score": 0.85,
  "src": "co-occurrence"
}
```

not this (wastes tokens):

```json
{"id":"abc123def456","title":"Logitech Wireless Mouse M720 Triathlon Multi-Device Wireless Mouse with Hyper-Fast Scrolling","description":"Connect up to 3 devices and easily switch between them...","category":"Computer Peripherals & Accessories","price":44.99,"originalPrice":59.99,...}
```

### user behavior representation

pre-process raw signals into meaningful buckets before sending:

```json
{
  "intent": "deliberating",
  "trigger": "scrolled_reviews",
  "session": {
    "productsViewed": ["Keyboard K380", "Keyboard MX Keys"],
    "categoryFocus": "keyboards",
    "timeOnCurrentProduct": "45s",
    "scrolledReviews": true,
    "cartItems": ["Mouse M720"]
  },
  "profile": {
    "topCategories": ["peripherals", "audio"],
    "avgSpend": 65,
    "recentPurchases": ["USB-C Hub", "Monitor Stand"]
  }
}
```

raw dwell times and scroll percentages are too noisy. bucket them: "glanced" (<5s), "browsed" (5-15s), "deliberating" (15-45s), "deep interest" (>45s).

---

## system prompt design

```
You are a helpful shopping advisor for an electronics store. You help customers
make informed purchase decisions — you never push products or use aggressive
sales language.

Your personality:
- Knowledgeable but not condescending
- Honest about trade-offs (mention downsides when relevant)
- Concise — 2-3 sentences max for the message
- If nothing is a strong match, say so

You will receive:
- The product the customer is currently viewing
- Their browsing behavior and purchase history
- A list of candidate products pre-selected by our recommendation engine,
  each with a relevance score and source algorithm

Your job:
1. Re-rank the candidates based on the full context (behavior + history + product fit)
2. Select the top 2-3 most relevant suggestions
3. Write a short, natural message acknowledging the customer's interest
4. For each suggestion, write a one-line reason why it's relevant

Output format (strict JSON):
{
  "suggestions": [
    {"productId": "...", "reason": "..."},
    {"productId": "...", "reason": "..."}
  ],
  "message": "..."
}

Rules:
- Never recommend products already in the customer's cart
- Never invent product features — only reference data you were given
- If the customer seems to be comparing products, help them compare
- Vary your language — don't start every message with "Great choice"
- Keep reasons specific: "30% cheaper with similar specs" beats "great value"
```

### few-shot examples (2-3 in the system prompt)

```json
// Example 1: user deliberating on a keyboard, has a mouse in cart
{
  "suggestions": [
    {"productId": "wrist-rest-01", "reason": "pairs well — most keyboard buyers add a wrist rest"},
    {"productId": "mx-keys-mini", "reason": "same build quality, compact layout, and $20 less"}
  ],
  "message": "solid keyboard choice. since you already have the M720 mouse, here's a wrist rest that pairs well, and a compact alternative if you prefer a smaller footprint."
}

// Example 2: user browsing category, no strong signal
{
  "suggestions": [
    {"productId": "best-seller-01", "reason": "top rated in this category with 450+ reviews"}
  ],
  "message": "still exploring? this one consistently gets the best reviews in this range."
}

// Example 3: nothing matches well
{
  "suggestions": [],
  "message": "looks like you know what you're looking for — let me know if you want help comparing options."
}
```

---

## UI components

### 1. question chips (zero LLM cost)

contextual prompts generated from product attributes, not from LLM:

```
product.category === "keyboards" →
  ["Is this good for typing?", "How loud is it?", "Compare with {similar_product}"]

product.category === "headphones" →
  ["How's the noise cancellation?", "Battery life?", "Good for calls?"]

generic fallbacks →
  ["What do buyers say?", "Any better deals?", "Compare options"]
```

these appear below the product info panel. clicking one triggers the LLM call with the question as additional context.

### 2. subtle readiness indicator

when behavior signals suggest the user might benefit from advice:

- the "Ask advisor" button gets a gentle pulse animation
- a small dot appears: "Advisor has a suggestion"
- **no popup, no modal, no interruption**

### 3. advisor sidebar (persistent, layout-level)

**not a drawer** — a persistent sidebar that lives in the root layout (or very close to it). this lets it:

- maintain conversation state across page navigations
- accumulate context from multiple pages the user has visited
- stay accessible from every page (home, category, product detail, cart)

**entry point:** a floating island/button in the bottom-right corner — this is where users expect chat assistants. clicking it slides the sidebar open from the right. the sidebar is always mounted but hidden until activated.

**sidebar behavior:**

- slides in from the right, pushes content or overlays depending on viewport width
- on mobile: full-screen overlay. on desktop: side panel (~380px wide)
- shows the AI message (streamed, word by word)
- below the message: 2-3 product card suggestions with reasons
- each card has "View product" and "Add to cart" actions
- collapse button at the top (doesn't destroy state, just hides)
- "Was this helpful?" thumbs up/down at the bottom (feedback signal)
- conversation history persists for the session — user can scroll back to previous exchanges
- the floating button shows a badge/indicator when the advisor has a new suggestion ready

**layout placement:**

```
app/layout.tsx (or a top-level client layout wrapper)
  └── AdvisorProvider (context: conversation state, behavior signals, open/closed)
       ├── {children}  ← all pages render here
       └── AdvisorSidebar  ← always mounted, toggled via floating button
            └── FloatingAdvisorButton  ← bottom-right, always visible
```

**state held at layout level:**

- conversation history (messages array)
- current behavior context (products viewed, dwell times, categories browsed)
- advisor open/closed state
- pending advice request ID (for streaming subscription)
- readiness signals (should we show indicator on the button?)

### 4. review summary (core trust surface)

on the product detail page, inside or directly above the reviews tab:

- show an AI-generated summary only when there are enough reviews to support it
- structure it as:
  - what buyers like (with count, e.g., "38 of 47 reviewers")
  - common complaints (with count)
  - **divided opinions** — explicitly surface conflicts when reviews are split (e.g., "most love the feel, but 9 report key wobble after 6+ months")
  - best for
  - confidence / number of reviews analyzed
- include 2-3 representative review snippets for grounding (linked to actual reviews)
- generated in batch, not on every page load

**critical lesson from Rufus:** Amazon's review summarization is their most-criticized feature. Rufus oversimplifies, fabricates themes, and misattributes sentiment. our review summaries must:

1. always include counts so users can gauge significance
2. surface conflicting opinions instead of hiding them behind majority sentiment
3. link to actual reviews so users can verify claims
4. run a post-generation validation step that checks claimed themes against the review corpus (string matching / semantic similarity)
5. never invent themes that don't appear in actual reviews

this is a **core** AI surface because it grounds the assistant in real customer feedback and directly supports trust. it's also our biggest opportunity to demonstrably outperform Rufus in the thesis evaluation.

### 5. compare mode (core decision-support surface)

when a user views or pins 2-3 products in the same category:

- offer a dedicated "Compare with AI" action
- generate a concise structured comparison:
  - key differences
  - tradeoffs
  - who each product is best for
  - recommendation only if evidence is strong
- avoid generic winner-picking; optimize for decision support

this is a **core** AI surface because comparison is one of the highest-value shopping tasks and one of the clearest ways to demonstrate thesis value.

### 6. cart cross-sell banner

on the cart page, after the order summary:

- inline banner (not a popup): "Before you check out..."
- 1-2 product suggestions with reasons
- this one CAN be proactive (user has committed to buying)
- dismissable, non-blocking

---

## Convex implementation

### function map — via `@convex-dev/agent`

the custom `requestAdvice → _generateAdvice → _saveAdvice` pipeline and the separate `persistent-text-streaming` alternative are both replaced by `@convex-dev/agent`. the agent component handles conversation state, streaming, tool calling, and persistence as a single integrated system.

```
packages/backend/convex/ai.ts

// define the shopping advisor agent
const shoppingAdvisor = new Agent(components.agent, {
  name: "Shopping Advisor",
  languageModel: google("gemini-3-flash"),      // via @ai-sdk/google
  instructions: SYSTEM_PROMPT,                   // system prompt + few-shot examples
  tools: {
    searchProducts,        // search catalog
    getRecommendations,    // call static recommendation functions
    getProductDetails,     // fetch product info for context
    getCartContents,       // read current cart
  },
  maxSteps: 3,
});

// public action — called when user clicks a chip or opens the advisor sidebar
requestAdvice({
  threadId?,            // existing thread for conversation continuity
  productId,
  question?,            // from chip click or typed question
})
  → creates or continues a thread via shoppingAdvisor
  → agent assembles context via tool calls
  → agent calls Gemini, streams response via delta chunks saved to DB
  → all connected clients get real-time updates via Convex subscriptions
  → returns threadId for future conversation continuity

// public query — client subscribes to the agent's thread for streaming updates
// uses the agent component's built-in thread/message queries

// public mutation — feedback
submitFeedback({ threadId, messageId, helpful: boolean })
```

**why `@convex-dev/agent` over the custom pipeline:**

- persistent conversation threads per user — the sidebar maintains history across page navigations
- delta-based streaming over Convex subscriptions — no HTTP streaming endpoint needed, all clients stay in sync
- built-in tool calling — the agent can call `searchProducts`, `getRecommendations`, etc. as Convex functions
- automatic context management — previous messages included in LLM calls
- built-in rate limiting integration (wraps `@convex-dev/rate-limiter`)
- usage tracking per user/model for cost monitoring

### rate limiting

```
packages/backend/convex/ai.ts

// use @convex-dev/rate-limiter (integrated into the agent component)
const rateLimiter = new RateLimiter(components.rateLimiter, {
  aiAdvicePerUser: {
    kind: "token bucket",
    rate: 10,        // 10 requests
    period: 3600000, // per hour
    capacity: 10,
  },
  aiAdviceGlobal: {
    kind: "token bucket",
    rate: 100,       // 100 requests
    period: 60000,   // per minute
    capacity: 200,
  },
});
```

---

## business case

### why this makes sense

| metric                      | without AI    | with AI assistant                        | source             |
| --------------------------- | ------------- | ---------------------------------------- | ------------------ |
| conversion rate             | 3.1%          | 12.3% (engaged users)                    | Rep AI / HelloRep  |
| AOV                         | baseline      | +20%                                     | Bloomreach Clarity |
| cart abandonment recovery   | 5-15% (email) | 35% (AI chat)                            | industry aggregate |
| support resolution          | 38 hours avg  | 5.4 minutes                              | industry aggregate |
| first-time buyer conversion | baseline      | 64% of AI-driven sales are new customers | HelloRep           |

### cost vs revenue for a store with 10K daily visitors

**cost side:**

- LLM API: ~$500/month (Gemini 3 Flash, 8K calls/day)
- Convex: within free tier or ~$25/month
- development: one-time (already building it)
- **total monthly cost: ~$525**

**revenue side (conservative estimate):**

- 10K visitors/day × 3.1% baseline conversion = 310 orders/day
- if AI lifts conversion by even 1% (to 4.1%): 410 orders/day = 100 incremental orders
- at $50 average order value: **$5,000/day incremental revenue**
- at 10% margin: **$500/day incremental profit**
- **monthly incremental profit: ~$15,000**
- **ROI: 28x** (even with conservative 1% lift vs the 4x that engaged users show)

### which product categories benefit most

| category          | why AI helps                                                | engagement level       |
| ----------------- | ----------------------------------------------------------- | ---------------------- |
| **electronics**   | complex specs, compatibility questions, comparison shopping | highest (58% adoption) |
| **fashion**       | subjective preferences, fit uncertainty, style matching     | high (41% adoption)    |
| **home & garden** | room compatibility, style coherence, size matching          | medium-high            |
| **beauty**        | skin type matching, ingredient concerns                     | high                   |

### competitive positioning

- **97% of retailers** have implemented or are developing AI — not having it is a disadvantage
- the moat is NOT the LLM (commoditizing) — it's the **data + context pipeline**
- our behavior tracking + recommendation engine + context assembly is the differentiator
- generic chatbot: no moat. domain-specific advisor with purchase context: 12-24 months before commoditization

### market context

- AI shopping assistant market: **$4.33B in 2025 → $46.76B by 2035** (27% CAGR)
- Amazon Rufus: **$12B incremental sales**, 300M users, 60% higher purchase completion
- Shopify AI shopping orders: **up 15x since January 2025**
- Morgan Stanley: nearly **half of online shoppers will use AI agents by 2030**

---

## other additions beyond the core plan

### 1. feedback loop

track whether users find the AI advice helpful. the "thumbs up/down" on the advisor sidebar feeds back into:

- trigger threshold tuning (if users mostly dismiss, raise thresholds)
- prompt quality iteration
- which product categories benefit most from AI advice

store this in a `adviceFeedback` table. this is your proprietary data moat.

### 2. question chip generation as a separate, cheap process

generating contextual question chips from product attributes is a one-time batch process, not a per-request LLM call. run it as a cron job when products are added/updated. store chips on the product document.

### 3. post-purchase recommendations via email/notification

no latency constraint, high value, and can use batch API (50% discount). after an order is delivered, send "based on your recent purchase of X, you might like..." — this is where the full recommendation pipeline + LLM explanation pays off most.

### 4. privacy-by-design & auth boundary

- **LLM calls require authentication** — anonymous users see readiness signals (question chips, advisor button) but clicking them prompts sign-in. this bounds LLM costs to identified users and enables usage tracking.
- behavior data stays **session-scoped** by default for anonymous users, never merged with authenticated profiles
- anonymous behavior is still useful: it drives client-side readiness signals without any backend round-trip
- clear privacy indicator when behavior tracking is active
- GDPR-compliant: data processing purpose must be defined narrowly (not "AI improvement" broadly)
- see `docs/data-layer-plan.md` § auth & session model for the full anonymous vs authenticated feature matrix

---

## implementation order for the AI phase

| step | what                                                                                                                                                                                     | depends on      |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| 1    | system prompt + few-shot examples design                                                                                                                                                 | —               |
| 2    | `@convex-dev/agent` setup + Gemini integration via `@ai-sdk/google`                                                                                                                      | step 1          |
| 2a   | `selectModel()` routing function (Flash vs Flash-Lite per query type)                                                                                                                    | step 2          |
| 3    | agent tools: `searchProducts`, `getRecommendations`, `getProductDetails`, `getCartContents`, `getReviewSummary`, `compareProducts` — configure for **parallel execution** where possible | phases 2, 3, 4  |
| 3a   | output validation layer — post-generation productId verification + factual claim stripping                                                                                               | step 3          |
| 4    | advisor sidebar UI (persistent sidebar + floating button + agent thread streaming + **product card hydration from live Convex data**)                                                    | step 2          |
| 5    | question chips (attribute-based, no LLM)                                                                                                                                                 | —               |
| 6    | readiness indicator (behavior-triggered UI)                                                                                                                                              | phase 4         |
| 7    | review summarization (batch, Flash-Lite) — **with conflict surfacing, count grounding, and post-generation theme verification**                                                          | phase 2 reviews |
| 8    | compare mode (structured table from product data + AI narrative from LLM)                                                                                                                | steps 3, 4      |
| 9    | rate limiting via `@convex-dev/rate-limiter` (integrated into agent)                                                                                                                     | step 2          |
| 10   | feedback collection + adviceFeedback table                                                                                                                                               | step 4          |
| 11   | cart cross-sell banner                                                                                                                                                                   | step 2          |
| 12   | exit intent nudge                                                                                                                                                                        | step 6          |

steps 1, 5 can start immediately. steps 2-8 are the core implementation (2a, 3a are Rufus-informed quality additions). steps 9-12 are supporting and follow-on additions.

---

## sources

### LLM selection & pricing

- [Gemini 3 Flash announcement](https://blog.google/products-and-platforms/products/gemini/gemini-3-flash/)
- [Gemini 3.1 Flash-Lite specs](https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-3-1-flash-lite/)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini context caching](https://ai.google.dev/gemini-api/docs/caching)
- [Claude Haiku 4.5](https://www.anthropic.com/news/claude-haiku-4-5)
- [AI API pricing comparison 2026](https://intuitionlabs.ai/articles/ai-api-pricing-comparison-grok-gemini-openai-claude)

### UX patterns & research

- [Amazon Rufus UX](https://blog.alby.com/amazons-new-ai-shopping-assistant-rufus-ux-review)
- [Shopify Sidekick](https://www.shopify.com/sidekick)
- [Shopify: building agentic systems](https://shopify.engineering/building-production-ready-agentic-systems)
- [Agentic AI UX patterns — Smashing Magazine](https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/)
- [Proactive vs reactive personalization](https://www.sciencedirect.com/science/article/abs/pii/S1071581918301824)

### business case & market

- [AI Shopping Assistant Market $4.33B](https://www.insightaceanalytic.com/report/ai-shopping-assistant-market/3071)
- [Amazon Rufus $12B sales](https://ppc.land/amazons-ai-shopping-assistant-drove-12-billion-in-sales-for-2025/)
- [4x conversion lift](https://www.hellorep.ai/blog/the-future-of-ai-in-ecommerce-40-statistics-on-conversational-ai-agents-for-2025)
- [Consumer AI trust data](https://www.retailmediabreakfastclub.com/55-of-consumers-say-they-dont-trust-ai-shopping-chatbots-recommendations/)
- [Morgan Stanley agentic commerce outlook](https://www.morganstanley.com/insights/articles/agentic-commerce-market-impact-outlook)
- [97% retailer AI adoption](https://ecomposer.io/blogs/ecommerce/ai-in-ecommerce-statistics)

### Convex integration

- [Convex persistent text streaming](https://www.convex.dev/components/persistent-text-streaming)
- [Convex AI agents](https://docs.convex.dev/agents)
- [Convex rate limiting](https://stack.convex.dev/rate-limiting)

### privacy & trust

- [ICO on agentic AI](https://www.insideprivacy.com/artificial-intelligence/ico-shares-early-views-on-agentic-ai-data-protection/)
- [Consumer resistance to AI chatbots](https://www.emerald.com/sjme/article/doi/10.1108/SJME-07-2024-0187/)
- [42% feel AI is an upsell tool](https://www.francescatabor.com/articles/2025/6/20/ai-powered-shopping-assistants-challenges-trends-and-kpis)
