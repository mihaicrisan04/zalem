# store UI spec — emag-inspired

based on emag.ro research, scoped to what we're actually building.

---

## what we're building vs what we're not

we're building a **demo e-commerce store** that feels like emag but is scoped to the features that matter for the AI assistant project. we're not building a marketplace, payment processing, or real logistics.

### in scope

- homepage with deals, categories, trending, personalized recommendations
- category pages with filters and sorting
- product detail pages with specs, reviews, similar products, frequently bought together
- search with autocomplete
- cart (full page)
- favorites/wishlist
- order history (fake, seeded)
- user account basics (profile, orders, favorites)
- fake checkout flow (no real payments)
- responsive design
- product badges (discount %, top favorite, deals)

### out of scope

- marketplace / multi-seller
- real payments / payment methods management
- Genius subscription system
- easybox / delivery logistics
- returns management
- visual search (eMAG Snap)
- newsletter / email notifications
- Q&A section on products
- warranty management

---

## pages & layouts

### global layout

**header (sticky):**
- logo (left)
- search bar (center, takes most width) — autocomplete dropdown
- user account icon + cart icon with badge count (right)
- favorites icon (heart) with count

**category nav bar (below header):**
- horizontal row of top-level categories
- hover/click opens mega menu with subcategories

**footer:**
- minimal — links, copyright

### 1. home page

```
┌─────────────────────────────────────────────┐
│ header + search + account/cart               │
├─────────────────────────────────────────────┤
│ category nav bar                             │
├─────────────────────────────────────────────┤
│ hero banner carousel (deals/campaigns)       │
├─────────────────────────────────────────────┤
│ deals of the day (countdown timer + grid)    │
├─────────────────────────────────────────────┤
│ trending products (horizontal scroll)        │
├─────────────────────────────────────────────┤
│ recommended for you (horizontal scroll)      │
├─────────────────────────────────────────────┤
│ browse by category (icon grid)               │
├─────────────────────────────────────────────┤
│ recently viewed (horizontal scroll)          │
├─────────────────────────────────────────────┤
│ footer                                       │
└─────────────────────────────────────────────┘
```

**sections:**
- **hero carousel** — 3-4 promotional banners, auto-rotate
- **deals of the day** — 4-6 products with discount badges, countdown timer
- **trending** — horizontal scrollable row, based on recent purchase volume with time decay
- **recommended for you** — personalized row (from user preferences, falls back to trending for anonymous)
- **browse by category** — grid of category cards with icons
- **recently viewed** — last 10 products the user looked at (client-side storage initially)

### 2. category page

```
┌─────────────────────────────────────────────┐
│ header                                       │
├─────────────────────────────────────────────┤
│ category nav (current category highlighted)  │
├──────────┬──────────────────────────────────┤
│ filters  │ sort bar (6 options)              │
│ sidebar  │──────────────────────────────────│
│          │ product grid (4 cols desktop,     │
│ - price  │ 2 cols tablet, 1 col mobile)      │
│ - brand  │                                   │
│ - rating │                                   │
│ - stock  │                                   │
│          │                                   │
│          │──────────────────────────────────│
│          │ pagination                        │
└──────────┴──────────────────────────────────┘
```

**filters (left sidebar):**
- price range — predefined buckets + custom min/max slider
- brand — checkboxes (show top 5, expand for more)
- minimum rating — star filter (4+, 3+, etc.)
- in stock toggle

**sorting (6 options, matching emag):**
1. most popular (default)
2. newest
3. price low → high
4. price high → low
5. review count
6. discount %

**product grid:**
- 60 products per page with pagination (not infinite scroll, like emag)
- URL-based filter/sort state (shareable, survives refresh)

### 3. product detail page

```
┌─────────────────────────────────────────────┐
│ header                                       │
├─────────────────────────────────────────────┤
│ breadcrumb (Home > Category > Subcategory)   │
├──────────────────┬──────────────────────────┤
│ image gallery    │ product title             │
│                  │ rating ★★★★☆ (123 reviews)│
│ main image       │ price: 299 lei            │
│ + thumbnails     │ old price: 399 lei (-25%) │
│                  │ badges: discount, deal     │
│                  │ stock: In stoc             │
│                  │                            │
│                  │ [Add to cart]              │
│                  │ [♡ Add to favorites]       │
│                  │ [Compare with similar]     │
├──────────────────┴──────────────────────────┤
│ tabs: Description | Specs | Reviews          │
├─────────────────────────────────────────────┤
│ tab content                                  │
├─────────────────────────────────────────────┤
│ frequently bought together (3-4 products)    │
├─────────────────────────────────────────────┤
│ similar products (horizontal scroll)         │
└─────────────────────────────────────────────┘
```

**product info panel:**
- full title (brand + model + key specs)
- star rating + review count (clickable → scrolls to reviews tab)
- current price (large), old price (strikethrough), discount % badge
- stock status
- add to cart button (primary CTA)
- add to favorites button (heart icon)
- compare with similar button (opens AI-assisted comparison flow for 2-3 products)

**tabs:**
- **description** — product description text
- **specifications** — key-value table (brand, model, dimensions, weight, etc.)
- **reviews** — aggregate rating breakdown (5-star bar chart) + AI review summary + individual reviews (rating, text, date, username)

**AI review summary (core):**
- shown at the top of the reviews tab when enough reviews exist
- compact structure:
  - what buyers like
  - common complaints
  - best for
  - based on X reviews
- should feel grounded in real feedback, not generic copy

**recommendation sections:**
- **frequently bought together** — 3-4 products from co-occurrence algorithm, with combined price
- **similar products** — horizontal scroll, from content-based similarity
- **compare mode** — user can select 2-3 similar products and ask the AI for a structured comparison

### 4. search results page

- same layout as category page (filters + grid + sort + pagination)
- search query shown at top: `Results for "wireless keyboard"`
- autocomplete dropdown while typing: shows top 5-8 product suggestions with thumbnails

### 5. cart page

```
┌─────────────────────────────────────────────┐
│ header                                       │
├─────────────────────────────────────────────┤
│ "My Cart" (X products)                       │
├──────────────────────────┬──────────────────┤
│ cart items list          │ order summary     │
│                          │                   │
│ [img] product title      │ subtotal: X lei   │
│       price: 299 lei     │ shipping: free    │
│       qty: [- 1 +]       │ total: X lei      │
│       [remove] [♡ save]  │                   │
│                          │ [Continue]        │
│ [img] product title      │                   │
│       ...                │                   │
├──────────────────────────┴──────────────────┤
│ you might also like (horizontal scroll)      │
└─────────────────────────────────────────────┘
```

**per item:**
- product thumbnail + title (linked to product page)
- unit price
- quantity stepper (- / + buttons)
- remove button
- save to favorites button

**order summary sidebar:**
- subtotal
- shipping (always "free" in our demo)
- total
- continue to checkout button

**recommendation section:**
- "you might also like" — based on cart contents (co-occurrence across all cart items)

### 6. favorites page

```
┌─────────────────────────────────────────────┐
│ header                                       │
├─────────────────────────────────────────────┤
│ "My Favorites" (X products)                  │
├─────────────────────────────────────────────┤
│ product grid (same cards as category page)   │
│ each card has [Add to cart] + [♡ remove]     │
├─────────────────────────────────────────────┤
│ empty state: illustration + "browse products"│
└─────────────────────────────────────────────┘
```

- same product card layout as category/search pages
- add to cart directly from favorites
- remove from favorites

### 7. order history page

```
┌─────────────────────────────────────────────┐
│ header                                       │
├─────────────────────────────────────────────┤
│ "My Orders"                                  │
│ tabs: [All] [Delivered] [Cancelled]          │
├─────────────────────────────────────────────┤
│ order #12345 — March 10, 2026               │
│ 3 items — total: 547 lei — Delivered ✓      │
│ [View details]                               │
├─────────────────────────────────────────────┤
│ order #12344 — March 5, 2026                │
│ 1 item — total: 199 lei — Delivered ✓       │
│ [View details]                               │
└─────────────────────────────────────────────┘
```

**order detail view:**
- order number, date, status
- list of items with thumbnails, titles, quantities, prices
- order total

### 8. checkout page (simplified)

```
step 1: review cart (already done on cart page)
step 2: delivery address (form: name, address, city, phone)
step 3: order confirmation summary
→ "Place order" button
→ success page with order number
```

no real payment — just a fake flow that creates an order record.

---

## product card component

the core reusable component. used everywhere: home, category, search, favorites, cart recommendations.

```
┌─────────────────────┐
│ [image]         [♡] │
│                     │
│ discount badge -25% │
├─────────────────────┤
│ Product Title Here  │
│ That Can Wrap       │
│                     │
│ ★★★★☆ (123)        │
│                     │
│ 299 lei             │
│ 399 lei (old price) │
│                     │
│ [Add to cart]       │
└─────────────────────┘
```

**elements:**
- product image (clickable → product detail)
- favorite toggle (heart icon, top-right)
- discount badge (top-left, if applicable)
- product title (2 lines max, truncated)
- star rating + review count
- current price (bold, large)
- old price (strikethrough, smaller, if discounted)
- add to cart button
- optional badges: "deal", "top favorite", "trending"

---

## key interactions

| action | behavior |
|--------|----------|
| add to cart | cart icon badge count updates, brief toast confirmation |
| remove from cart | item removed, totals recalculate (optimistic) |
| quantity change | stepper updates, totals recalculate (optimistic) |
| favorite toggle | heart fills/unfills, toast confirmation |
| search typing | autocomplete dropdown after 2+ chars, debounced 300ms |
| filter change | product grid updates without full page reload, URL updates |
| sort change | grid re-sorts, URL updates |
| pagination | scroll to top, grid updates |

---

## user flows summary

### browse → buy flow
1. home page → click category or search
2. category page → browse/filter/sort → click product
3. product detail → read description/specs/reviews
4. add to cart
5. cart page → review items → continue
6. checkout → address → place order
7. order confirmation

### favorites flow
1. browse products → click heart on any product card
2. go to favorites page → review saved items
3. add to cart from favorites or remove

### order history flow
1. account → my orders
2. filter by status tab (all/delivered/cancelled)
3. click order → view detail

---

## responsive breakpoints

| breakpoint | grid cols | sidebar | notes |
|------------|-----------|---------|-------|
| desktop (1280+) | 4 | visible | full layout |
| tablet (768-1279) | 2-3 | collapsible drawer | filters toggle |
| mobile (< 768) | 1-2 | bottom sheet | hamburger nav, sticky cart button |

---

## color & design notes

emag uses blue + orange/red as brand colors. we're not copying their brand — we'll use our own design system from `@zalem/ui` (optics). but the layout patterns, information hierarchy, and interaction patterns should feel familiar to anyone who's used emag or similar stores.
