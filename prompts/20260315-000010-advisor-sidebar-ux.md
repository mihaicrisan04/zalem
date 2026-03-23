note that in the ai integration plan i dont want it to be in a drawer. i want it to be in a sidebar, and should allways be there but hidden, even on the home page. should likely be part of the root layout or very close to a higher level layout so that we can hold state there from multiple actions and from multiple pages.
and also i think the best way to do this have it as a floating island/button in the bottom right because most people are used to chat assistants there

---

> AI updated `docs/ai-integration-plan.md` — replaced the "advisor panel (side drawer)" section with a persistent sidebar design. Key changes: (1) sidebar lives in root layout, always mounted but hidden, so it maintains state across page navigations; (2) entry point is a floating button in the bottom-right (familiar chat assistant pattern); (3) AdvisorProvider context wraps all pages, holding conversation history, behavior signals, and open/closed state; (4) on mobile it's a full-screen overlay, on desktop a ~380px side panel; (5) conversation history persists for the session. Updated architecture diagram and all references from "drawer/panel" to "sidebar" throughout the doc.
