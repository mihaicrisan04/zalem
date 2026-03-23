i want the build the following project in this monorepo:
## Create an AI Assistant for an E-commerce Store

Using a very fast multimodal LLM (e.g., Google Gemini 3.0 Flash), build context based on user behavior from tracked parameters and suggest items or recommendations efficiently and intelligently based on user actions on the website.

---

### What It Tracks

#### Client-Side

- Cursor position
- Time cursor spends on an item in the list
- Eye tracking (possibly)
- Which item the user is viewing

#### Backend

- User preferences from the algorithm
- User spending trends based on previous purchases

---

### What It Returns

- Suggestions for better purchases or deals
- Messages that acknowledge the user's choice and elegantly encourage them to complete the purchase (e.g., "You've picked a great choice")

---

### Important Caveats

- This shouldn't run on every interaction. It should intelligently pick the best times to activate—for example, when the user spends more than X seconds on a product or when they enter a product page and read the description for 5-10 seconds, or when they access the review section.
- The AI context should be thorough, meaning the AI should know what's on the page, have data about the user, and understand related products.

**⭐ Core Principle: It's all about the context.**

---

now the folliwng things have to happen. i would have to implment a fake store and a fake recommendattion static alogirhtmg and build upon on that to add the ai integration. i wnat you to make a research on the internmet the best way to dot this. what papers should i read related to this. what phases should we go through. a first glance of how a future architecture can look like in conex schema.

i want you to create a doc file that you can saave as DOC.md or something or even create a docs dir or something wehre we can save docuemtns on how we can make this porjecnt haappen. rihgt now i want to reserach direction and what this would take, this monorepo has only the base ui components tthat we can for sure use for the store and the ai and has auth working and the db as well ursing clerk so we are good on that part.
go ahead and make this reserach

---

> AI ran 3 parallel research agents (recommendation systems, behavior tracking, LLM e-commerce patterns), compiled findings into `docs/ai-assistant-research.md` covering papers, architectures, Convex schema draft, tracking approach, trigger system, and LLM integration strategy.
