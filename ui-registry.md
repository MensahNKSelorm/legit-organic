# Legit Organic UI Registry

### Weekly Planning Story

File: `frontend/app/(public)/subscriptions/page.tsx`
Last updated: 2026-08-19

| Property | Class / pattern |
| --- | --- |
| Background | warm paper sequence: `bg-[#F4EFE4]`, `bg-[#FFFDF8]`, dark green and gold action fields |
| Border | `border-[#173C2A]/20 dark:border-white/15` |
| Border radius | none |
| Text — primary | `text-[#173C2A] dark:text-white` |
| Text — secondary | `text-[#675E52] dark:text-[#BBC8BD]` |
| Spacing | `py-20 md:py-28`; connected rhythm stages use compact vertical spacing |
| Hover state | restrained mark movement and underlined actions; reduced-motion fallback required |
| Shadow | none |
| Accent usage | green for active information; gold for checkout/start actions |

**Pattern notes:** “Plan the week” is the customer-facing name for subscriptions. Explain the real sequence—basket, renewal order, explicit customer approval, delivery—without implying stored authorization or automatic charging. Skip, pause, resume and cancel belong to customer control language. Show the sequence as one connected rhythm, never numbered steps or a feature-card grid. Headlines must read as one natural thought; avoid the repeated two-sentence or split-slogan formula. Operational process headings use Cabinet Grotesk (`font-sans`) for immediate legibility; reserve Sentient for the page hero and expressive closing moments.

### About Operating Story

File: `frontend/app/(public)/about/page.tsx`
Last updated: 2026-08-19

| Property | Class / pattern |
| --- | --- |
| Background | forest origin field, paper body, sand principles, gold closing action |
| Border | one-pixel green/white transparency rules |
| Border radius | none |
| Text — primary | forest on paper; white on forest |
| Text — secondary | brown/soft green supporting copy |
| Spacing | major story fields `py-20 md:py-28`; principle rows `py-9` |
| Hover state | subtle image scale and direct button color inversion |
| Shadow | none |
| Accent usage | gold marks the thesis and final decision field |

**Pattern notes:** About should explain the operating idea, not manufacture milestones, statistics or certifications. Organize the story around purpose, principles and the source-to-delivery route. Keep each statement specific enough to verify as the business grows.

## Baseline — Established 2026-08-01

The storefront should feel like a Ghanaian market, field journal and working kitchen—not a generic SaaS dashboard. This baseline was established after auditing the existing redesign.

| Property         | Correct pattern                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------- |
| Display type     | `display-organic` / Sentient 500; readable editorial character for major headings              |
| Functional type  | Cabinet Grotesk for navigation, body text, forms, prices, labels and controls                 |
| Page background  | `bg-[#FAF7F0] dark:bg-[#171B18]`                                                              |
| Primary surface  | Transparent or page background; use rules before enclosed cards                               |
| Border           | `border-[#0D3B2A]/20 dark:border-white/15` or `editorial-rule`                                |
| Radius           | Square by default; reserve circles for avatars, status indicators and genuinely circular data |
| Primary text     | `text-[#0D3B2A] dark:text-[#FAF7F0]`                                                          |
| Secondary text   | `text-[#5B3E31] dark:text-[#B8D4BD]`                                                          |
| Accent           | Ghana gold `#F4C430` for primary actions, numbering and selected emphasis                     |
| Primary button   | Square gold field, dark green text, bold Cabinet Grotesk                                      |
| Secondary action | Text link with a bottom border; avoid automatic pill treatment                                |
| Small labels     | `editorial-label`; use sparingly and never add a decorative leading line by default           |
| Motion           | Small image scale or directional movement; honour `prefers-reduced-motion`                    |

### Editorial Page Header

File: `frontend/components/ui/EditorialPageHeader.tsx`

- Dark green field with a bottom rule rather than a floating card.
- Large Sentient title paired with a restrained Cabinet Grotesk description.
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

| Property         | Class                                                    |
| ---------------- | -------------------------------------------------------- |
| Background       | page-aware transparent or cream/dark navigation surface  |
| Border           | `border-[#0D3B2A]/20 dark:border-white/25`               |
| Border radius    | none                                                     |
| Text — primary   | `text-[#0D3B2A] dark:text-white`                         |
| Text — secondary | `text-white/60` inside the identity header               |
| Spacing          | compact 40px toolbar controls; menu rows use `px-3 py-3` |
| Hover state      | border strengthens; menu rows receive a faint gold field |
| Shadow           | offset green shadow for the account menu only            |
| Accent usage     | gold identity tile and cart count                        |

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

| Property         | Class                                                             |
| ---------------- | ----------------------------------------------------------------- |
| Background       | cream/dark catalogue sheet over a deep-green translucent backdrop |
| Border           | `border-[#0D3B2A]/20 dark:border-white/15`                        |
| Border radius    | none                                                              |
| Text — primary   | `text-[#0D3B2A] dark:text-white`                                  |
| Text — secondary | `text-[#5B3E31] dark:text-[#B8D4BD]`                              |
| Spacing          | broad catalogue field; compact ruled result cards                 |
| Hover state      | slight image scale; green-to-gold title shift in dark mode        |
| Shadow           | one deep page-level shadow, none on result cards                  |
| Accent usage     | gold sidebar label, dark-mode search rule and direct actions      |

**Pattern notes:** Search opens as a near-full-width market catalogue rather than a rounded dialog. Categories form a ruled index in the green sidebar, never pills. The idle state loads real featured products from the live catalogue under one short “Suggested” label; never use decorative stock images or hardcoded demo products here. Results resemble produce entries on a market table: square imagery, top rules, name and price beneath. No-result language is limited to “Nothing found” and one action.

### Product Catalogue Cards

File: `frontend/components/products/ProductCard.tsx`
Last updated: 2026-08-01

- Standard cards stretch to the full height of their grid cell.
- Product names use the explicit `product-name-sans` Cabinet Grotesk rule and reserve two lines. Global element defaults belong in Tailwind’s base layer so intentional font, line-height, colour and underline utilities remain effective. Category/origin reserves two lines, and descriptions reserve three lines above the mobile breakpoint.
- Price, unit and actions remain aligned at the bottom regardless of copy length.
- The intentionally enlarged featured product keeps its separate editorial layout; equal-height rules apply to the standard product grid and related-product grid.
- The main market uses a compact two-column phone grid. At that width, cards use a shorter image, keep descriptions to two compact lines and shorten “Add to Cart” to “Add”; full three-line copy and spacing return at the small breakpoint.

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

| Property        | Pattern                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| Background      | Django Unfold shell with forest-green operational fields and one gold identity docket |
| Border          | thin ruled grids using the current foreground at 14–25% opacity                       |
| Border radius   | none in custom dashboard content                                                      |
| Display type    | Sentient for owner greeting, section headings and key figures                         |
| Functional type | Cabinet Grotesk for actions, queues, tables and labels                                |
| Primary action  | square ruled cell with icon and direct verb; gold fill on hover                       |
| Status          | short text with a gold underline, never a pill                                        |
| Shadow          | none inside dashboard content                                                         |

**Pattern notes:** The dashboard is an operations surface, not a generic analytics template. Its content area is always the dark night-market/control-room surface, independent of the surrounding admin theme; forms and ordinary admin pages may still follow light or dark mode. Use only four section names: Analytics, Actions, Attention and Orders. For the owner and finance roles, lead with a terse five-number snapshot and restrained charts for sales, fulfilment, products, customers and order channels. An empty dataset becomes a short ruled empty state rather than a blank canvas or invented demo data. Other roles should still lead with permitted actions and live queues. Role identity is explicit. Future admin changelists should favour readable rows, useful filters and direct verbs over decorative cards.

### Email Verification Transition

File: `frontend/app/(auth)/check-email/page.tsx`
Last updated: 2026-08-01

| Property         | Class                                                                      |
| ---------------- | -------------------------------------------------------------------------- |
| Background       | `bg-[#FAF7F0] dark:bg-[#171B18]` with one `bg-[#0D3B2A]` instruction field |
| Border           | `editorial-rule` / `border-white/20`                                       |
| Border radius    | none                                                                       |
| Text — primary   | `text-[#0D3B2A] dark:text-[#FAF7F0]`                                       |
| Text — secondary | `text-[#5B3E31] dark:text-[#B8D4BD]` / `text-white/70`                     |
| Spacing          | generous page fields; compact ruled actions                                |
| Hover state      | white-to-gold text and underline transition                                |
| Shadow           | none                                                                       |
| Accent usage     | gold envelope line and primary action; green italic display phrase         |

**Pattern notes:** Verification is a transition page, not a modal or success card. Keep the email destination visible, explain only the next action, and let resend feedback replace the resend control in place.

### Django Admin Sidebar

File: `backend/products/static/admin/css/legitorganic-admin.css`
Last updated: 2026-08-01

| Property       | Pattern                                            |
| -------------- | -------------------------------------------------- |
| Background     | solid forest green; deeper forest in dark mode     |
| Border         | white at 14–18% opacity for search and divisions   |
| Border radius  | none                                               |
| Text — primary | warm white at 78–100% opacity                      |
| Text — section | harvest gold, uppercase, tightly tracked           |
| Spacing        | retain Unfold's compact navigation rhythm          |
| Hover state    | transparent gold wash with white text              |
| Shadow         | none                                               |
| Accent usage   | gold for icons, section labels and active identity |

**Pattern notes:** Navigation is grouped by working department—Catalogue & Stories, Commerce, People, Wholesale, Sales Team and Useful Links. It uses a fixed forest shell with a white wordmark, gold section markers, a single ruled search field and a quiet account footer. The whole control-room shell is deliberately dark across devices; individual staff see only navigation backed by their role permissions. Keep the automatically generated “all applications” catalogue hidden; the sidebar should expose deliberate workflows, not Django's model registry.

### Django Editorial Forms

File: `backend/products/static/admin/css/legitorganic-admin.css`
Last updated: 2026-08-01

| Property        | Pattern                                                             |
| --------------- | ------------------------------------------------------------------- |
| Background      | transparent fieldsets with one forest-green editorial title field   |
| Border          | one-pixel foreground rules at 16–20% opacity                        |
| Border radius   | none on fieldsets, inputs, editors and actions                      |
| Display type    | Sentient for the workflow identity only                             |
| Functional type | Cabinet Grotesk for labels, help, fields and controls               |
| Section label   | uppercase compact heading on a faint forest wash; gold in dark mode |
| Focus state     | gold border and one-pixel gold focus ring                           |
| Shadow          | none                                                                |
| Accent usage    | gold marks publication/storefront state and active focus            |

**Pattern notes:** Product, blog and recipe forms share one disciplined editing system but carry different identities: Market shelf, Field journal and Kitchen notebook. At desktop size the supporting fieldsets may form a two-column working grid; the main writing field and inline collections stay full-width. Never restyle content forms as floating SaaS cards.

### Long-form Stories and Legal Documents

Files: `frontend/app/(public)/blog/[slug]/page.tsx`, `frontend/app/(public)/recipes/[slug]/page.tsx`, `frontend/app/(public)/privacy-policy/page.tsx`, `frontend/app/(public)/terms-of-service/page.tsx`

- Cabinet Grotesk carries long reading text.
- Sentient is reserved for document titles and editorial subheads.
- Legal sections use a two-column index/content layout on desktop and a single reading column on mobile.

### Staff Account Setup

File: `backend/templates/staff/setup.html`
Last updated: 2026-08-01

| Property        | Pattern                                                  |
| --------------- | -------------------------------------------------------- |
| Background      | night `#111827` with a full-height forest identity field |
| Border          | one-pixel white transparency; gold on focus              |
| Border radius   | none                                                     |
| Display type    | Sentient/Georgia-like serif for the welcome message       |
| Functional type | Arial/system sans for fields and operational details     |
| Primary text    | warm white                                               |
| Secondary text  | muted green-grey                                         |
| Spacing         | generous split-page composition; compact form rhythm     |
| Hover state     | gold-to-white transition                                 |
| Shadow          | none                                                     |
| Accent usage    | gold identity mark, focus and primary action             |

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

| Property         | Pattern                                                     |
| ---------------- | ----------------------------------------------------------- |
| Background       | night workbench with one forest identity field              |
| Border           | one-pixel white rules at 13–17% opacity                     |
| Border radius    | none                                                        |
| Text — primary   | warm white; Sentient only for the assistant identity        |
| Text — secondary | white at 52–62% opacity                                     |
| Spacing          | compact `1.15rem–1.25rem` work cells with ruled divisions   |
| Hover state      | gold action may move to white; no floating-card motion      |
| Shadow           | none                                                        |
| Accent usage     | gold for labels, icon and deliberate Apply/Generate actions |

**Pattern notes:** The assistant is an editorial workbench inside the existing form, never a chatbot, modal or floating AI button. It starts with one factual instruction field, shows a contained preview and states that nothing has been saved. Blog forms may use a taller brief field for topic, audience, facts and angle, but retain the same workbench styling. Applying a draft only edits the current unsaved Django form; existing prose requires explicit replacement confirmation. Structured recipe output appends editable ingredient and step rows and links exact catalogue matches. AI failures leave every field untouched.

### Weekly Delivery and Business Supply

Files: `frontend/app/(public)/subscriptions/page.tsx`, `frontend/components/subscriptions/SubscriptionPlans.tsx`, `frontend/app/(public)/b2b/page.tsx`
Last updated: 2026-08-08

| Property         | Class                                                  |
| ---------------- | ------------------------------------------------------ |
| Background       | `bg-[#F4EFE4] dark:bg-[#171B18]`                       |
| Surface          | `bg-[#FFFDF8] dark:bg-[#202620]`                       |
| Border           | `border-[#C9BEAA] dark:border-white/15`                |
| Border radius    | none                                                   |
| Text — primary   | `text-[#173C2A] dark:text-white`                       |
| Text — secondary | `text-[#675E52] dark:text-[#AFC0B2]`                   |
| Spacing          | broad page fields with ruled, compact rows             |
| Hover state      | subtle surface shift or increased link-arrow gap       |
| Shadow           | none                                                   |
| Accent usage     | gold for one active marker or primary dark-mode action |

**Pattern notes:** Weekly delivery and B2B are working commerce tools, not lifestyle editorials or SaaS pricing pages. Use one readable Sentient statement followed by direct functional labels. Plan choices are square market-ledger columns separated by rules; never use pricing pills, tier medals or feature-checklist cards. Builders, quote forms and management pages use underlined fields and divided product rows. Status stays plain uppercase text. Household and business experiences share this system but keep separate entry points and language.

- Motion uses masked upward reveals, one slow travelling rule and plant-stem sway on plan hover. Never use unexplained popularity dots, bouncing badges or perpetual card movement. All motion must honour `prefers-reduced-motion`.
- Plan-size marks use literal produce baskets: one recognisable item for Solo, three different vegetables for Family and five varieties for Large Household. Avoid repeated abstract circles. Motion is a brief produce-settle response on hover.
- The weekly process uses one asymmetrical composition: a forest produce-crate field beside two compact operational rows. Do not fall back to three equal feature cards labelled Choose, Pay and Control.
- Informational process rows use static card/phone and calendar/control illustrations—not directional arrows—so they cannot be mistaken for links. Keep headline copy above basket artwork with an explicit stacking layer.
- Plan names, household size, short description, weekly price, prominence and contents come from Django Admin. Frontend preview values are only a local/API-unavailable fallback.
- The B2B landing page uses institutional line drawings in a continuous ruled marquee, not icon cards or stock photography. Restaurant, school, hotel, catering, retail and institutional marks should read clearly at a glance.
- Explain the B2B service as one connected operating rhythm: Order is an open catalogue/crate, Quote is a working sheet, and Repeat is a delivery vehicle with a drawn return loop. The three panels may be asymmetrical, but their artwork must remain functional rather than ornamental.
- B2B motion communicates supply in progress: a travelling route marker, an endless institution marquee and a repeating delivery loop. Hover movement is reserved for the object being handled; respect reduced-motion preferences.
- Hero delivery routes must have literal endpoints and cargo: a farm-to-kitchen path with a recognisable produce basket. The basket follows the curved route itself; never animate an unexplained geometric marker beside the line.
- Route motion keeps cargo upright, fades it in as it leaves the farm, and fades it out as it reaches the kitchen doorway. The invisible final third prevents a visible teleport back to the farm before the next departure.
- B2B section introductions keep heading and supporting copy in one vertical reading path. Avoid the repeated AI-layout habit of a heading on the left and explanatory text on the right.
- Workflow illustrations should be literal and abundant: Order uses a produce-filled woven basket with recognisable tomato, carrots and leafy vegetables—avoid geometrically segmented produce that reads like an abstract ball. Quote is readable before interaction and rewrites on hover. Repeat uses a recognisable box delivery truck with cargo body, cab, windscreen and grounded wheels; its thin route arrow stays clear of the roof and fades completely before its stroke resets.
- Closing calls to action use a compact full-width operating band (loading bay, stocked basket, destination), not a lone headline in a framed panel surrounded by large desktop gutters.
- The B2B closing band asks “Fresh stock?” and answers “On schedule.”, ending at a clearly labelled business receiving bay—not a domestic kitchen. Several small, differently stocked baskets travel left-to-right on staggered cycles. Define `transform` at every opacity keyframe and keep horizontal velocity constant; an omitted position lets the browser interpolate toward the SVG's base position and can stack two baskets together. Moving directional arrows anchor the route, and baskets fade before resetting so they never jump visibly backwards.
- Public business-application forms place the existing Turnstile challenge in a ruled verification row immediately before errors and submission. Keep the primary action disabled until a token exists, and replace hard widget failures with one concise Retry control.

### Legit Organic Times

Files: `frontend/app/(public)/blog/page.tsx`, `frontend/app/(public)/blog/[slug]/page.tsx`, `frontend/components/blog/BlogCard.tsx`, `frontend/components/blog/BlogCategoryFilter.tsx`, `frontend/components/blog/ArticleShare.tsx`
Last updated: 2026-08-20

- Legit Organic Times is a contemporary Ghanaian broadsheet, not a grid of lifestyle cards. Use a strong nameplate, double rules, asymmetric story hierarchy and flat editorial columns.
- Paper character comes from lightweight CSS gradients and theme tokens. Do not use watermarked, distressed-stock textures or fake torn edges.
- Story hierarchy is communicated through scale, column span, rules and whitespace. Avoid rounded cards, pill categories, avatar bylines, gradients and decorative badges.
- Headlines use the editorial serif; metadata, navigation and functional labels use the established grotesk. Article bodies keep a comfortable measure and may use a restrained opening drop cap.
- The article sheet may feel tactile, but remains crisp and readable in both themes. Use subtle grain, folio details and captions rather than ornamental vintage effects.
- Category filters behave like newspaper desk links with underlines. Related stories remain a ruled list, not another card carousel.
- Journal routes share the light-paper navigation treatment on every nested article path, not only on `/blog`.

### Homepage Market-to-Kitchen Journey

Files: `frontend/components/home/HeroSection.tsx`, `frontend/components/home/HomeJourney.tsx`, `frontend/components/home/FeaturedProducts.tsx`, `frontend/components/home/RecipesTeaser.tsx`
Last updated: 2026-08-19

- The homepage follows one practical loop: see what is fresh, imagine the meal, then choose one-time or weekly delivery. Each section should advance that loop instead of presenting unrelated feature cards.
- The hero is photographic and full-bleed. Keep its copy short enough to read over a changing farm image: one provenance line, one two-part promise, one explanatory sentence and two actions.
- Avoid the repeated two-beat headline formula (`Short statement. Short statement.`). Homepage sections deliberately vary their rhythm: a complete hero statement, a market-style label, a directional kitchen headline and a compact thematic phrase.
- Use `Your week starts at the farm.` as the current positioning line. Supporting copy should sound direct and useful, never like generic wellness advertising.
- Use `From Ghanaian farms to everyday kitchens` for the hero provenance line. Avoid stacked slogan fragments such as `Picked locally · Cooked simply · Delivered your way`.
- Apply the same discipline across public marketing pages. Market uses stall-sign language, Recipes reads like a kitchen notebook, Weekly uses planning language, About states a belief, and B2B speaks in operational terms. Do not force every page into one brand-slogan cadence.
- The journey section is a forest-green route with three connected ruled stops: Market, Kitchen and Weekly. Ghana gold appears on hover and focus, not as a full-viewport background.

### Weekly Basket Registration

File: `frontend/app/(public)/subscriptions/start/page.tsx`
Last updated: 2026-08-19

| Property | Class / pattern |
| --- | --- |
| Background | `bg-[#F4EFE4]`, working surfaces `bg-[#FFFDF8]` |
| Border | Market-paper rules using `border-[#C9BEAA]` and `border-[#D8CEBC]` |
| Border radius | None; the registration flow uses a market-sheet/workbench language |
| Text — primary | `text-[#173C2A]` |
| Text — secondary | `text-[#625B51]`, metadata `text-[#756D61]` |
| Typography | Sentient display only for the page title; Cabinet Grotesk for stages, fields and totals |
| Spacing | Major groups `gap-10` / `mt-10`; field groups `gap-6`; controls `px-4 py-3` |
| Focus state | Immediate `focus-visible:ring-2 focus-visible:ring-[#2E7D32]` |
| Accent usage | Ghana gold for payment/focus emphasis; leaf green for active progress and links |

**Pattern notes:**

- Registration is a named three-stage market workbench: Basket, Delivery and Review. Do not add ordinal step numbers.
- Keep the weekly basket summary visible beside the working stage on desktop and in normal document flow on smaller screens.
- Prepared baskets and custom Market selection share one total. Product names link to their Market detail pages; quantity controls remain compact and keyboard accessible.
- Delivery fields preload from the authenticated profile and may be assisted by the optional map, but manual entry must always remain available.
- SeevCash is described as a fresh customer-approved checkout for each delivery. After a subscription has been created, retry payment against that saved subscription instead of creating another one.
- Section language is verb-led and concise: `Choose fresh.`, `Cook local.`, `Keep it moving.` Headings may be expressive; explanations stay to one sentence wherever possible.
- Motion communicates change or direction: slow photographic crossfades, masked reveals and a short arrow movement. No bouncing, floating decoration or unrelated continuous animation. Always preserve the reduced-motion path.
- At 320–768 px, hero actions stack, navigation collapses, display text may wrap anywhere as a last resort, and every image-bearing grid uses zero-minimum tracks. No CTA or navigation label may wrap.
- Licensed third-party photography must link to `/photo-credits`. Record the work title, creator, original source, licence and any crop or tonal adjustment. Never imply that identifiable people are Legit Organic suppliers or endorsers without confirmation.
