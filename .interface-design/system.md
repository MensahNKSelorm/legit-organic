# Legit Organic Staff Workspace

## Direction

The staff interface is a calm operations workspace for people managing food, orders, customers, subscriptions, content, and wholesale relationships. It should feel open and professional: practical like a well-run market office, warm enough to belong to Legit Organic, and never like a raw database console.

The interface must prioritize the work a staff member can act on now. Administrative structure, audit records, and implementation details are secondary and should not compete with daily tasks.

## Product world

- Domain: harvest, produce crates, recipe notebooks, market orders, delivery rounds, trusted sourcing, careful bookkeeping.
- Color world: forest leaves, fresh herbs, unbleached paper, ripe maize gold, charcoal ink, muted clay, natural linen.
- Signature: a role-aware “control room” where each person sees a focused work queue while the owner retains the complete operational map.
- Reject: generic Django empty states, model-first navigation, repeated KPI card walls, decorative gradients, excessive borders, and equal emphasis for every record type.

## Navigation and permissions

- The owner/superuser sees the complete navigation and all permitted administrative records.
- Other staff see only destinations relevant to their assigned role and Django permissions.
- Hiding a navigation item is presentation, not authorization. Server-side permissions remain authoritative.
- Daily destinations remain visible. Diagnostic, historical, and system-owned records belong in advanced or owner-only areas.
- Group navigation by staff intent: Catalogue & Stories, Commerce, Weekly Delivery, Customers, Staff, Wholesale, Sales Team, Useful Links.
- Avoid placing the same destination in the sidebar, work queue, operational views, and quick actions unless each placement serves a distinct task.
- One “Visit live site” link is generally sufficient. Deep public links should appear only for roles that actively review that content.

## Hierarchy

- One focal point per page. On the dashboard, this is “Today’s work.” On a list page, it is the records and their primary action. On an edit page, it is the form section currently being completed.
- Prefer this dashboard order: greeting and role; today’s work; compact key metrics; recent activity; shortcuts; one primary analysis; link to full analytics.
- Use weight, contrast, and spacing before increasing type size.
- Type scale: metadata 11px; caption 12px; body 13–14px; subsection 16–18px; section 22px; dashboard greeting 28–36px.
- Dynamic figures use tabular numerals.
- Explanatory copy should be short and operational. If text does not change a decision or clarify an action, omit it.

## Density and spacing

- Base spacing unit: 4px.
- Micro gaps: 4–8px.
- Control and row spacing: 8–12px.
- Panel padding: 16–20px for work surfaces; 24px only for prominent empty or first-run states.
- Section spacing: 24–32px; do not give every subsection equal separation.
- Minimum interactive target: 44px where practical, never below 40px.
- Tables remain compact, but important identifiers, statuses, amounts, and actions need clear separation.

## Palette and tokens

- Forest brand: `#0d3b2a`; use for identity, primary anchors, and selected states.
- Maize gold accent: `#f4c430`; reserve for primary actions, focus, and meaningful emphasis.
- Light canvas: `#f7f4ec`; light surface: `#fffdf8`; raised surface: `#ffffff`.
- Light ink: `#173126`; supporting text: `#66756d`; faint text: `#89958e`.
- Dark canvas: `#111827`; dark surface: `#171b18`; raised dark surface: `#1d241f`.
- Dark ink: `#f8f4e9`; supporting dark text: `#b8c3ba`.
- New UI should use semantic `--lo-*` tokens rather than introducing isolated color literals.
- Preserve readable contrast in light, dark, hover, selected, disabled, and focus states.

## Depth and surfaces

- Primary depth strategy: quiet borders and subtle tonal surface shifts.
- Light-mode raised surfaces may use the existing restrained ring plus soft shadow.
- Dark mode relies on low-opacity borders rather than deep shadows.
- Sidebar and page canvas should feel related, separated by one subtle rule rather than competing background worlds.
- Inputs are inset surfaces and should be slightly darker than their surrounding panel.
- Avoid heavy card shadows, thick outlines, and decorative elevation.

## Typography

- Use Inter for the staff workspace and operational data.
- Hierarchy comes from weight and tone: primary 600–700, supporting 500–600, metadata 400–500 with muted color.
- Large headings use slightly negative letter spacing; body copy uses approximately 1.5 line-height.
- Uppercase tracked labels are reserved for short operational eyebrows and status metadata.
- Do not use editorial or promotional prose inside routine admin sections.

## Reusable patterns

### Record empty state

- Use for important staff-owned collections instead of Django’s default empty result.
- Layout: 16–24px padding; quiet bordered raised surface; compact brand icon; clear heading; one sentence; one permitted primary action.
- Explain the next valid step, not the database condition.
- If the user cannot add records, omit the action and explain who or what creates them.
- Search/filter zero-results states are different: preserve the query context and offer “Clear filters,” not “Create first record.”

### Work queue

- Show only non-zero actionable exceptions in “Today’s work.”
- Order by severity, then count.
- Color communicates priority; it is not decoration.
- Clicking a queue opens the correctly filtered record list.

### Operational shortcut

- Compact row or tile, approximately 64–72px high.
- Contains one icon, a task label, and an optional count.
- Do not repeat it as a large quick-action card elsewhere on the same page.

### Primary action

- Minimum 44px height; maize gold on forest text.
- Hover may invert to forest with light text.
- Focus uses a visible gold outline with at least 2px width and offset.
- Active feedback may use a restrained `scale(.97–.99)` transform.

### Data list

- Lead with the record identifier or customer-facing name.
- Keep status, money, date, and primary action visually distinct.
- Secondary provider IDs, hashes, retry metadata, and audit fields belong in collapsed detail sections.
- Provide purposeful empty, loading, validation, and failure states.

### Financial presentation

- Treat finance as a dedicated workspace, not additional homepage chart cards.
- Separate gross sales, discounts, refunds, provider fees, commissions, receivables, payouts, and net revenue.
- Every figure must state its date basis and financial meaning.
- Reconciliation and exceptions lead; decorative analytics follow.

## Interaction and motion

- Repeated operational actions should feel immediate and use little or no motion.
- Hover and focus transitions: 120–180ms, limited to color, opacity, and transform.
- Never use `transition: all`.
- Respect `prefers-reduced-motion`.
- Popovers, dropdowns, notifications, and theme controls require complete keyboard and focus behavior.

## Consistency checklist

- Does the page have one obvious focal task?
- Is navigation appropriate for the current role while authorization remains enforced server-side?
- Is any information repeated without a distinct purpose?
- Are technical fields collapsed or restricted appropriately?
- Are empty, filtered-empty, loading, error, hover, focus, and disabled states covered?
- Does the screen remain readable in light and dark mode?
- Are spacing values on the 4px grid and colors bound to semantic tokens?
- Does the interface feel like Legit Organic’s operations workspace rather than generic Django Admin?
