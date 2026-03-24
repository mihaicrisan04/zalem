# behavior tracking & readiness signals

how the behavior tracking system works, what signals are collected, and when readiness indicators appear.

---

## how tracking works

### data flow

```
user browses store
  → tracking hooks collect engagement data (client-side)
  → useBehaviorTracker aggregates into a buffer (Map<productId, engagement>)
  → buffer flushes to Convex every 5 seconds (or on page change / tab close)
  → behaviorSessions table stores aggregated per-session data
  → useReadinessSignals evaluates thresholds client-side (no backend call)
  → UI shows advisor pulse / question chips when thresholds are hit
```

### what gets tracked per product

| signal             | hook                                  | how it's measured                                                                                |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------------------------ |
| dwell time (ms)    | `useDwellTime`                        | timer runs while mouse is over the product container. cumulative across multiple hover events    |
| scroll depth (0-1) | `useScrollDepth`                      | max scroll position on the page. `scrollY / (scrollHeight - innerHeight)`. resets on page change |
| cursor hover (ms)  | alias of dwell time                   | same value, stored separately for clarity                                                        |
| viewed reviews     | `useBehaviorTracker.setViewedReviews` | set to true when reviews section becomes the active section                                      |
| viewport time (ms) | `useViewportTracking`                 | IntersectionObserver tracks how long the element is visible in viewport                          |

### session management

- session ID stored in `sessionStorage` (unique per browser tab)
- anonymous users tracked by sessionId only (no clerkUserId)
- authenticated users get clerkUserId attached
- sessions are not merged across tabs or sign-in events (privacy-by-design)

### flush behavior

| trigger         | when                                                                     |
| --------------- | ------------------------------------------------------------------------ |
| interval        | every 5 seconds                                                          |
| page navigation | on pathname change (Next.js router)                                      |
| tab close/hide  | on `visibilitychange` event when `document.visibilityState === "hidden"` |

### backend storage

the `behaviorSessions` table uses **max-value merging**: when the same product appears in multiple flushes, the backend keeps the maximum dwell time, scroll depth, and hover time. `viewedReviews` is OR-merged (once true, stays true).

---

## readiness signals

all readiness evaluation happens **client-side** — no backend call to decide whether to show an indicator. the evaluator reads from the behavior tracker's in-memory state.

### signal thresholds

| signal                  | condition                                               | what happens                                                                   | persists?                         |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------- |
| **product dwell**       | cursor on product detail page >15s (or >5s on a card)   | advisor button starts breathing animation                                      | until page change                 |
| **deep scroll**         | >50% of product detail page scrolled                    | advisor button starts breathing animation                                      | until page change                 |
| **review engagement**   | user scrolls to reviews section                         | "What do buyers think?" chip appears next to reviews heading                   | stays until dismissed (permanent) |
| **comparison behavior** | 3+ products viewed in same category without add-to-cart | "Compare these products?" chip appears above similar products + advisor pulses | stays until dismissed (permanent) |
| **cart deliberation**   | items in cart + navigating away from product pages      | "Need help deciding?" chip appears                                             | stays until dismissed (permanent) |

### chip placement (contextual)

chips appear where they're contextually relevant, not in a generic location:

| chip                      | placement                        | why there                             |
| ------------------------- | -------------------------------- | ------------------------------------- |
| "What do buyers think?"   | next to "Reviews (N)" heading    | user is already looking at reviews    |
| "Compare these products?" | above "Similar products" section | user has been browsing the category   |
| "Need help deciding?"     | layout-level (via store layout)  | user is navigating away from products |

### advisor button behavior

- **always visible** on all store pages (fixed bottom-right)
- **breathing animation** when readiness signals fire: gentle scale (1 → 1.1) and opacity (1 → 0.8) over 2.5s cycle, plus elevated shadow
- clicking shows a placeholder toast (phase 6 will open the AI advisor sidebar)

### chip behavior

- chips **persist** once they appear — they don't disappear on a timer
- chips can be **dismissed** via the X button — once dismissed, they stay dismissed for the entire session
- chips are **not** generated by the LLM — they're attribute-based, zero cost per page view
- clicking a chip shows a placeholder toast (phase 6 will trigger the AI advisor with that question)

---

## composite interest score (for future use)

the plan defines a composite interest score for more nuanced threshold evaluation:

```
interestScore =
    (dwellTimeMs / 1000) × 0.35
  + scrollDepth × 0.25
  + (cursorHoverMs / 1000) × 0.15
  + (viewedReviews ? 1 : 0) × 0.25
```

this score is not currently used for readiness signals (we use simple per-signal thresholds instead), but it's available for the AI advisor in phase 6 to determine context richness.
