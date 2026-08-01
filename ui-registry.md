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

### Long-form Stories and Legal Documents

Files: `frontend/app/(public)/blog/[slug]/page.tsx`, `frontend/app/(public)/recipes/[slug]/page.tsx`, `frontend/app/(public)/privacy-policy/page.tsx`, `frontend/app/(public)/terms-of-service/page.tsx`

- Cabinet Grotesk carries long reading text.
- Boska is reserved for document titles and editorial subheads.
- Legal sections use a two-column index/content layout on desktop and a single reading column on mobile.
