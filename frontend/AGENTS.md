<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->


# Legit Organic Frontend Rules

These rules apply to all frontend work in this directory.

## Frontend workflow

Use the available frontend skills deliberately:

1. Use `frontend-skill` for frontend implementation quality, architecture,
   component structure, responsive implementation, and general frontend craft.

2. Use `interface-design` for visual hierarchy, typography, spacing,
   surfaces, component consistency, and maintaining the established design system.

3. Use `hallmark` as an anti-slop review layer.
   Avoid generic AI-generated design patterns unless they genuinely fit the product.

4. Review frontend work against the Vercel Web Interface Guidelines:
   https://vercel.com/design/guidelines

These systems should complement each other rather than compete.
Do not blindly satisfy one rule if doing so makes the overall interface worse.

---

## Design principles

The interface should feel deliberately designed for Legit Organic,
not like a generic AI-generated website or template.

Prefer:
- strong visual hierarchy
- intentional typography
- restrained use of decoration
- clear information architecture
- consistent spacing and sizing
- project-specific visual decisions
- meaningful asymmetry when appropriate
- layouts shaped by the content rather than by a generic template

Avoid by default:
- generic centered hero + two buttons layouts
- excessive rounded cards
- cards nested inside cards
- arbitrary pill badges
- decorative gradient blobs
- excessive glassmorphism
- repetitive three-column feature grids
- identical cards repeated across every section
- generic purple/blue AI palettes
- excessive shadows
- meaningless decorative icons
- unnecessary gradients
- oversized headings with little supporting hierarchy
- excessive whitespace used merely to appear premium
- visual effects without a functional or brand purpose

These are not absolute bans.
Use them when they are genuinely appropriate for the design.

---

## Interaction

- All interactive functionality must be usable with a keyboard.
- Interactive elements must have visible `:focus-visible` states.
- Use links for navigation and buttons for actions.
- Do not use clickable `div` or `span` elements when semantic HTML exists.
- Touch targets should be comfortably usable on mobile.
- Never disable browser zoom.
- Never unnecessarily prevent copy, paste, or autofill.
- Destructive actions should require appropriate confirmation or recovery.
- Provide appropriate hover, active, disabled, loading, and error states.

---

## Accessibility

- Prefer semantic HTML before adding ARIA.
- Every form control must have an accessible label.
- Icon-only controls require accessible names.
- Images require appropriate alt text when meaningful.
- Do not communicate important information using color alone.
- Maintain a logical heading hierarchy.
- Ensure sufficient color contrast.
- Preserve keyboard focus when dialogs, menus, and overlays open or close.

---

## Motion

- Respect `prefers-reduced-motion`.
- Motion should clarify state, hierarchy, or interaction.
- Prefer animating `transform` and `opacity`.
- Avoid `transition: all`.
- Avoid excessive entrance animations.
- Do not animate merely because animation is possible.
- Keep interaction feedback fast and intentional.

---

## Responsive design

Test layouts across:
- small mobile screens
- larger phones
- tablets
- laptops
- desktop monitors
- wide displays

Prefer:
- CSS Grid
- Flexbox
- intrinsic sizing
- responsive CSS

Avoid JavaScript-based layout measurement when CSS can solve the problem.

Prevent:
- horizontal overflow
- accidental scrollbars
- text clipping
- broken navigation
- unusable touch targets
- overly stretched layouts on large screens

---

## Forms

- Use appropriate HTML input types.
- Use `autocomplete`, `name`, and `inputmode` where relevant.
- Support browser autofill and password managers.
- Allow paste into fields, including authentication fields.
- Display validation errors close to the relevant control.
- Preserve user input when validation fails.
- Enter should submit forms where users reasonably expect it.
- Disable submission only when necessary.
- Show clear loading and success states.

---

## Content states

Every data-driven interface should consider:

- loading
- empty
- error
- partial data
- success
- disabled
- offline or unavailable states where relevant

Do not design only the ideal populated state.

---

## Performance

- Prevent cumulative layout shift.
- Give images appropriate dimensions or aspect ratios.
- Lazy-load below-the-fold media where appropriate.
- Avoid unnecessary client-side JavaScript.
- Avoid unnecessary React re-renders.
- Prefer server components where appropriate for the current Next.js version.
- Avoid expensive work on the main thread.
- Keep animations performant.
- Do not sacrifice usability for unnecessary visual effects.

---

## Next.js

The Next.js rules at the top of this file take precedence for framework-specific APIs.

Before implementing unfamiliar Next.js behavior:
1. inspect the relevant documentation in `node_modules/next/dist/docs/`;
2. use the APIs documented for the installed version;
3. do not rely on remembered behavior from older Next.js versions.

---

## Final frontend review

Before considering a frontend task complete:

1. Verify the implementation against the installed Next.js documentation.
2. Review implementation quality using `frontend-skill`.
3. Review visual hierarchy and consistency using `interface-design`.
4. Run a Hallmark-style anti-slop review.
5. Review against the Vercel Web Interface Guidelines.
6. Check keyboard accessibility.
7. Check mobile and desktop layouts.
8. Check loading, empty, error, and disabled states where applicable.
9. Check for obvious layout shift or unnecessary client-side work.
10. Perform one final visual pass after all fixes.

Fix issues found during these reviews rather than merely listing them.