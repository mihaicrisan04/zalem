# phase 4+5: behavior tracking + readiness signals — dev journal

## overview

building the behavior tracking infrastructure (client-side signal collection, event buffer, backend storage) and the readiness signal system (client-side evaluator that shows contextual question chips and pulses the advisor button when the user might benefit from AI assistance).

these phases are combined because phase 5 (readiness signals) is purely client-side evaluation that reads from phase 4's tracking data.

---

## 2026-03-24 — initial implementation

### what was built

**backend:**
- `packages/backend/convex/behavior.ts` — single `upsertSession` mutation that merges incoming behavior data with existing session records. uses max-value merging for dwell time, scroll depth, hover time. upserts by sessionId.

**tracking hooks:**
- `use-dwell-time` — ref-based hover duration tracking with cumulative time across multiple hover events
- `use-viewport-tracking` — IntersectionObserver via react-intersection-observer, tracks time element is visible in viewport
- `use-scroll-depth` — max scroll position on page (0-1), resets on pathname change, uses requestAnimationFrame for throttling
- `use-product-engagement` — composite hook combining dwell + viewport + scroll into a single engagement object. merges refs from dwell (useRef) and viewport (callback ref)

**event buffer:**
- `use-behavior-tracker` — central event buffer with React context. maintains a Map<productId, engagement> buffer. flushes to backend every 5 seconds, on page navigation, and on tab hide/close via visibilitychange event. generates session ID via sessionStorage (unique per browser tab session). supports both anonymous and authenticated users.

**readiness signals:**
- `use-readiness-signals` — client-side evaluator with 5 signal types:
  1. product dwell (>5s on card, >15s on detail page) → pulse advisor button
  2. deep scroll (>50% on product detail) → "Is this the right choice for you?" chip
  3. review engagement (viewed reviews tab) → "What do buyers think?" chip
  4. comparison behavior (3+ products in same category) → "Compare these products?" chip + pulse
  5. cart deliberation (has cart items, navigating away) → "Need help deciding?" chip
- cooldown system: dismissed chips don't reappear for 60 seconds

**UI components:**
- `advisor-button` — fixed bottom-right floating button with Sparkles icon, pulse animation when readiness signals fire, placeholder toast for phase 6
- `question-chips` — contextual chips shown below product info, each dismissible, animated entrance. clicking shows placeholder toast for phase 6

### architecture decisions

1. **sessionStorage for session ID** (not localStorage) — each browser tab gets its own session. this avoids cross-tab contamination of behavior data and is more accurate for session-based analysis.

2. **max-value merging in upsert** — when the same product appears in multiple flushes, we keep the maximum dwell time, scroll depth, and hover time. this handles the case where the user hovers multiple times — cumulative on client, max on server.

3. **no viewport tracking on product grid cards** — tracking 24+ cards simultaneously would be noisy and hurt performance. deep engagement tracking only on the product detail page.

4. **readiness evaluation entirely client-side** — no backend round-trip. the evaluator reads from the tracker's in-memory state. this means showing a chip is instant and free.

5. **BehaviorTrackerContext at layout level** — the tracker is mounted once in the store layout and persists across all page navigations. question chips and advisor button read from this context.

### integration points

- store layout: wraps children with BehaviorTrackerContext, mounts AdvisorButton
- product detail page: tracks engagement via useProductEngagement + ref on container, tracks review tab views, shows QuestionChips in the product info panel

### known limitations

- advisor button currently shows a toast placeholder — real sidebar comes in phase 6
- question chip click shows a toast placeholder — real AI responses come in phase 6
- no sendBeacon fallback (visibilitychange fires the normal flush, which works for most browsers)
- viewport tracking uses 100ms polling interval — could be optimized with fewer updates but this is fine for ~200 products

---
