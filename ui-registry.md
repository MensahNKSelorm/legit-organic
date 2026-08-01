# Legit Organic UI Registry

## Baseline — Established 2026-08-01

The storefront should feel like a Ghanaian market, field journal and working kitchen—not a generic SaaS dashboard. This baseline was established after auditing the existing redesign.

| Property | Correct pattern |
| --- | --- |
| Display type | `display-organic` / Boska 500; reserve for expressive headings, product names and editorial moments |
| Functional type | Cabinet Grotesk for navigation, body text, forms, prices, labels and controls |
| Page background | `bg-[#FAF7F0] dark:bg-[#171B18]` |
| Primary surface | Transparent or page background; use rules before enclosed cards |
| Border | `border-[#0D3B2A]/20 dark:border-white/15` or `editorial-rule` |
| Radius | Square by default; reserve circles for avatars, status indicators and genuinely circular data |
| Primary text | `text-[#0D3B2A] dark:text-[#FAF7F0]` |
| Secondary text | `text-[#5B3E31] dark:text-[#B8D4BD]` |
| Accent | Ghana gold `#F4C430` for primary actions, numbering and selected emphasis |
| Primary button | Square gold field, dark green text, bold Cabinet Grotesk |
| Secondary action | Text link with a bottom border; avoid automatic pill treatment |
| Small labels | `editorial-label`; use sparingly and never add a decorative leading line by default |
| Motion | Small image scale or directional movement; honour `prefers-reduced-motion` |

### Editorial Page Header

File: `frontend/components/ui/EditorialPageHeader.tsx`

- Dark green field with a bottom rule rather than a floating card.
- Large Boska title paired with a restrained Cabinet Grotesk description.
- Asymmetrical two-column desktop composition; natural stacking on mobile.
- Gold is used inside the title or for one small label, not everywhere.

Do not reuse this header automatically. Recipes and Blog intentionally use separate page identities:

- Recipes: image-led kitchen/worktable composition with a gold recipe-note panel.
- Blog: quiet paper-like newspaper masthead with rules and editorial columns.
- Numbered cards are not part of either page language.

### Recipe Catalogue and Search

File: `frontend/app/(public)/recipes/page.tsx`

- Treat recipes as individual kitchen building blocks (for example Fufu, Light Soup and Kontomire Stew), not fixed meal combinations.
- A `+` search means “assemble these components into one meal”; `fufu + light soup` opens one combined page with grouped ingredients and preparation sections.
- Search matches recipe titles, descriptions and ingredient names while keeping non-curated customer recipes private.
- Catalogue headings must remain truthful as the collection grows; avoid hard-coded counts such as “three dishes”.
- Recipe results use an unnumbered, even grid so the page feels like a useful kitchen index rather than a ranked list.
- The search is a long editorial rule immediately above the Recipe Shelf, not a compact control inside the hero.
- The complete card surface opens the recipe; secondary actions remain independently clickable.
- Autocomplete suggestions are square, ruled editorial rows beneath the long search line. `+` and `and` both create a combined-meal suggestion.
- Combined-meal heroes use a real split-image collage from the selected recipe covers; do not invent a single misleading food photograph.
- Recipe names remain links in the hero, ingredient groups and preparation groups so customers can return to one component.
- Ingredient fields are always editable in place and grouped by recipe. Save remains disabled until a field changes; logged-out customers are asked to log in only when saving. Product matches appear as shop links without changing the public recipe.
- Recipe pages keep structural language short: use “Ingredients” and “Method”; avoid stacking editorial headings above functional content.
- Single recipes use “Recipe notebook.” Combinations state their component count and can add further dishes without a two-recipe limit.
- “Add dish +” belongs beside the recipe title and opens a compact overlay; do not repeat it below the ingredient editor.
- Combination controls stay as small ruled text actions beneath the title: “Add dish +” leads, while each removable component uses muted white text that turns gold on hover. Never render them as pills.
- Combined meals stop at four components. At the limit, replace the add action with the quiet gold status “Plate complete · 4 dishes”; removal remains available.
- A generated pairing note occupies the existing hero-description position and keeps the same restrained `text-white/75` body treatment. Show deterministic copy immediately; AI enhancement must never introduce a spinner or delay the page.
- Recipe queries accept `+`, `and`, commas, or catalogue-aware whitespace. Never split raw spaces without longest-title matching because recipe names may contain several words.
- Private recipe titles are editable for authenticated customers and participate in the same dirty/save state as ingredient edits.
- Empty video areas use a dark, 16:9 admin-preview field with a restrained play control; replace it with the real video only when one is configured.

### Editorial Empty State

File: `frontend/components/ui/EditorialEmptyState.tsx`

- Structured like a journal entry with a number, statement and optional action.
- Uses horizontal rules instead of a rounded empty-state box.
- Copy explains what will happen next without generic “check back soon” language.

### Contact Form

File: `frontend/app/(public)/contact/ContactForm.tsx`

- Transparent form surface with underline inputs.
- Labels use Cabinet Grotesk and sentence case where practical.
- One full-width gold submit field; no rounded card wrapper.

### Account Surfaces

Files: `frontend/app/(protected)/profile/page.tsx`, `frontend/app/(protected)/my-recipes/page.tsx`

- Customer records are presented as a ledger/notebook rather than a SaaS dashboard.
- Panels use top rules and transparent backgrounds.
- Existing functional controls may retain compact borders, but structural cards remain square.
- Profile heroes pair a large cream-paper title with one dark green identity docket; do not use a floating avatar card.
- Account navigation begins directly with the ruled choices; do not add a label above it. On mobile it becomes a two-column index; active state is a narrow gold edge, never a filled pill.
- Empty wishlist, recipe and order states are left-aligned editorial records with one direct link. Avoid circular icons, emojis and centered card copy.
- Delivery fields use a clear two-column form beneath a separate heading and location action; never compress the heading and fields into one row. Saving uses one square gold field.
- Saved recipe rows must set explicit cream/green text colors in dark mode; never depend on light-theme `charcoal` aliases.

### Storefront Navigation Controls

Files: `frontend/components/layout/Navbar.tsx`, `frontend/components/cart/CartIcon.tsx`
Last updated: 2026-08-01

| Property | Class |
| --- | --- |
| Background | page-aware transparent or cream/dark navigation surface |
| Border | `border-[#0D3B2A]/20 dark:border-white/25` |
| Border radius | none |
| Text — primary | `text-[#0D3B2A] dark:text-white` |
| Text — secondary | `text-white/60` inside the identity header |
| Spacing | compact 40px toolbar controls; menu rows use `px-3 py-3` |
| Hover state | border strengthens; menu rows receive a faint gold field |
| Shadow | offset green shadow for the account menu only |
| Accent usage | gold identity tile and cart count |

**Pattern notes:** Search and theme controls share one ruled toolbar. The cart remains a separate market-basket control. Its empty state repeats the same line-drawn basket inside a square ruled frame with one offset gold marker; never revert to a generic shopping-bag icon. The account menu opens as a square identity docket with the customer’s details first and navigation second; avoid rounded floating menus and generic circular avatars.

### Authentication Layout

Files: `frontend/app/(auth)/login/page.tsx`, `frontend/app/(auth)/signup/page.tsx`, `frontend/components/layout/SiteFooter.tsx`
Last updated: 2026-08-01

- Authentication and verification routes never render the global footer.
- Desktop forms must fit inside the visible viewport; signup may scroll inside its form column on shorter screens.
- Login fields use quiet bordered surfaces with internal horizontal padding, rather than text touching an underline or page edge.

### Market Search Catalogue

File: `frontend/components/search/SearchModal.tsx`
Last updated: 2026-08-01

| Property | Class |
| --- | --- |
| Background | cream/dark catalogue sheet over a deep-green translucent backdrop |
| Border | `border-[#0D3B2A]/20 dark:border-white/15` |
| Border radius | none |
| Text — primary | `text-[#0D3B2A] dark:text-white` |
| Text — secondary | `text-[#5B3E31] dark:text-[#B8D4BD]` |
| Spacing | broad catalogue field; compact ruled result cards |
| Hover state | slight image scale; green-to-gold title shift in dark mode |
| Shadow | one deep page-level shadow, none on result cards |
| Accent usage | gold sidebar label, dark-mode search rule and direct actions |

**Pattern notes:** Search opens as a near-full-width market catalogue rather than a rounded dialog. Categories form a ruled index in the green sidebar, never pills. The idle state loads real featured products from the live catalogue under one short “Suggested” label; never use decorative stock images or hardcoded demo products here. Results resemble produce entries on a market table: square imagery, top rules, name and price beneath. No-result language is limited to “Nothing found” and one action.

### Product Catalogue Cards

File: `frontend/components/products/ProductCard.tsx`
Last updated: 2026-08-01

- Standard cards stretch to the full height of their grid cell.
- Product names reserve two lines, category/origin reserves two lines, and descriptions reserve three lines.
- Price, unit and actions remain aligned at the bottom regardless of copy length.
- The intentionally enlarged featured product keeps its separate editorial layout; equal-height rules apply to the standard product grid and related-product grid.

### Homepage Recipe Teaser

File: `frontend/components/home/RecipesTeaser.tsx`
Last updated: 2026-08-01

- On the dark recipe panel, labels use gold, primary copy uses white and supporting copy uses pale green.
- The empty-catalogue action remains white with a square gold arrow control in dark mode.
- Apply the same contrast rules to future featured-recipe content; never rely on light-mode green or brown text inside the dark panel.
- When a featured recipe exists, its card opens that recipe while the separate “All recipes” link opens the complete shelf.

### Django Admin Control Room

File: `backend/templates/admin/index.html`
Last updated: 2026-08-01

| Property | Pattern |
| --- | --- |
| Background | Django Unfold shell with forest-green operational fields and one gold identity docket |
| Border | thin ruled grids using the current foreground at 14–25% opacity |
| Border radius | none in custom dashboard content |
| Display type | Boska for owner greeting, section headings and key figures |
| Functional type | Cabinet Grotesk for actions, queues, tables and labels |
| Primary action | square ruled cell with icon and direct verb; gold fill on hover |
| Status | short text with a gold underline, never a pill |
| Shadow | none inside dashboard content |

**Pattern notes:** The dashboard is an operations surface, not a generic analytics template. Its content area is always the dark night-market/control-room surface, independent of the surrounding admin theme; forms and ordinary admin pages may still follow light or dark mode. Use only four section names: Analytics, Actions, Attention and Orders. For the owner and finance roles, lead with a terse five-number snapshot and restrained charts for sales, fulfilment, products, customers and order channels. An empty dataset becomes a short ruled empty state rather than a blank canvas or invented demo data. Other roles should still lead with permitted actions and live queues. Role identity is explicit. Future admin changelists should favour readable rows, useful filters and direct verbs over decorative cards.

### Email Verification Transition

File: `frontend/app/(auth)/check-email/page.tsx`
Last updated: 2026-08-01

| Property | Class |
| --- | --- |
| Background | `bg-[#FAF7F0] dark:bg-[#171B18]` with one `bg-[#0D3B2A]` instruction field |
| Border | `editorial-rule` / `border-white/20` |
| Border radius | none |
| Text — primary | `text-[#0D3B2A] dark:text-[#FAF7F0]` |
| Text — secondary | `text-[#5B3E31] dark:text-[#B8D4BD]` / `text-white/70` |
| Spacing | generous page fields; compact ruled actions |
| Hover state | white-to-gold text and underline transition |
| Shadow | none |
| Accent usage | gold envelope line and primary action; green italic display phrase |

**Pattern notes:** Verification is a transition page, not a modal or success card. Keep the email destination visible, explain only the next action, and let resend feedback replace the resend control in place.

### Django Admin Sidebar

File: `backend/products/static/admin/css/legitorganic-admin.css`
Last updated: 2026-08-01

| Property | Pattern |
| --- | --- |
| Background | solid forest green; deeper forest in dark mode |
| Border | white at 14–18% opacity for search and divisions |
| Border radius | none |
| Text — primary | warm white at 78–100% opacity |
| Text — section | harvest gold, uppercase, tightly tracked |
| Spacing | retain Unfold's compact navigation rhythm |
| Hover state | transparent gold wash with white text |
| Shadow | none |
| Accent usage | gold for icons, section labels and active identity |

**Pattern notes:** Navigation is grouped by working department—Catalogue & Stories, Commerce, People, Wholesale, Sales Team and Useful Links. It uses a fixed forest shell with a white wordmark, gold section markers, a single ruled search field and a quiet account footer. The whole control-room shell is deliberately dark across devices; individual staff see only navigation backed by their role permissions. Keep the automatically generated “all applications” catalogue hidden; the sidebar should expose deliberate workflows, not Django's model registry.

### Django Editorial Forms

File: `backend/products/static/admin/css/legitorganic-admin.css`
Last updated: 2026-08-01

| Property | Pattern |
| --- | --- |
| Background | transparent fieldsets with one forest-green editorial title field |
| Border | one-pixel foreground rules at 16–20% opacity |
| Border radius | none on fieldsets, inputs, editors and actions |
| Display type | Boska for the workflow identity only |
| Functional type | Cabinet Grotesk for labels, help, fields and controls |
| Section label | uppercase compact heading on a faint forest wash; gold in dark mode |
| Focus state | gold border and one-pixel gold focus ring |
| Shadow | none |
| Accent usage | gold marks publication/storefront state and active focus |

**Pattern notes:** Product, blog and recipe forms share one disciplined editing system but carry different identities: Market shelf, Field journal and Kitchen notebook. At desktop size the supporting fieldsets may form a two-column working grid; the main writing field and inline collections stay full-width. Never restyle content forms as floating SaaS cards.

### Long-form Stories and Legal Documents

Files: `frontend/app/(public)/blog/[slug]/page.tsx`, `frontend/app/(public)/recipes/[slug]/page.tsx`, `frontend/app/(public)/privacy-policy/page.tsx`, `frontend/app/(public)/terms-of-service/page.tsx`

- Cabinet Grotesk carries long reading text.
- Boska is reserved for document titles and editorial subheads.
- Legal sections use a two-column index/content layout on desktop and a single reading column on mobile.

### Staff Account Setup

File: `backend/templates/staff/setup.html`
Last updated: 2026-08-01

| Property | Pattern |
| --- | --- |
| Background | night `#111827` with a full-height forest identity field |
| Border | one-pixel white transparency; gold on focus |
| Border radius | none |
| Display type | Georgia/Boska-like serif for the welcome message |
| Functional type | Arial/system sans for fields and operational details |
| Primary text | warm white |
| Secondary text | muted green-grey |
| Spacing | generous split-page composition; compact form rhythm |
| Hover state | gold-to-white transition |
| Shadow | none |
| Accent usage | gold identity mark, focus and primary action |

**Pattern notes:** Staff onboarding is a private identity handoff, not a generic password-reset card. The setup URL must send `same-origin`, `no-store` and `noindex` headers and must not load third-party fonts or assets while the invitation token is present. `same-origin` is required so Django can validate HTTPS CSRF submissions without leaking the token-bearing URL to third parties. Show the assigned company login and role, never the raw token. Expired, revoked, accepted and invalid invitations replace the form with one concise lifecycle state. The owner-facing invitation list remains inside the permission-aware control-room shell.

### Admin People and Boolean Controls

Files: `backend/legitorganic/settings.py`, `backend/users/admin.py`, `backend/products/static/admin/css/legitorganic-admin.css`
Last updated: 2026-08-01

- Customers and staff are separate working areas. Never expose the mixed base User list in the primary sidebar.
- New staff enter through Staff Invitations; accepted accounts appear under Staff Accounts.
- Staff Accounts is an owner-only operational register for role visibility and account activation. Owner accounts remain protected from editing there.
- Use compact square checkboxes for multi-select and table selection only.
- Boolean yes/no fields use one coherent capsule track with a circular handle: charcoal when off, forest and gold when on.
- Generic input-radius rules must always exclude checkboxes and radios so they cannot flatten switch tracks.

### Admin Writing Assistant

Files: `backend/templates/admin/includes/writing_assistant.html`, `backend/products/static/admin/css/legitorganic-admin.css`
Last updated: 2026-08-01

| Property | Pattern |
| --- | --- |
| Background | night workbench with one forest identity field |
| Border | one-pixel white rules at 13–17% opacity |
| Border radius | none |
| Text — primary | warm white; Boska only for the assistant identity |
| Text — secondary | white at 52–62% opacity |
| Spacing | compact `1.15rem–1.25rem` work cells with ruled divisions |
| Hover state | gold action may move to white; no floating-card motion |
| Shadow | none |
| Accent usage | gold for labels, icon and deliberate Apply/Generate actions |

**Pattern notes:** The assistant is an editorial workbench inside the existing form, never a chatbot, modal or floating AI button. It starts with one factual instruction field, shows a contained preview and states that nothing has been saved. Applying a draft only edits the current unsaved Django form; existing prose requires explicit replacement confirmation. Structured recipe output appends editable ingredient and step rows and links exact catalogue matches. AI failures leave every field untouched.
