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

### Long-form Stories and Legal Documents

Files: `frontend/app/(public)/blog/[slug]/page.tsx`, `frontend/app/(public)/recipes/[slug]/page.tsx`, `frontend/app/(public)/privacy-policy/page.tsx`, `frontend/app/(public)/terms-of-service/page.tsx`

- Cabinet Grotesk carries long reading text.
- Boska is reserved for document titles and editorial subheads.
- Legal sections use a two-column index/content layout on desktop and a single reading column on mobile.
