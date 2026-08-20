# UI Registry

### Recipe Market Ingredients

File: `components/recipes/RecipeShopIngredients.tsx`
Last updated: 2026-08-20

| Property | Class |
| --- | --- |
| Background | transparent; primary action `bg-[#F4C430]` |
| Border | `border-y border-[#0D3B2A]/20 dark:border-white/15` |
| Border radius | none — editorial section pattern |
| Text — primary | `text-[#0D3B2A] dark:text-[#F8F4EA]` |
| Text — secondary | `text-[#5B3E31] dark:text-[#B8D4BD]` |
| Label | `text-xs font-bold uppercase tracking-[.18em] text-[#2E7D32]` |
| Spacing | `py-7`, rows `py-4`, content gaps `gap-3` to `gap-5` |
| Hover state | action lifts with `hover:-translate-y-0.5`; text actions use a bottom rule |
| Shadow | none |
| Accent usage | Ghana gold for primary cart action; leaf green for editorial labels |

**Pattern notes:** Recipe commerce should feel like an editorial extension of the recipe, not a generic product card. Keep unavailable ingredients visible, show the exact selected Market pack, and never hide or silently replace a recipe ingredient.

### Recipe Nutrition Estimate

File: `app/(public)/recipes/[slug]/page.tsx`
Last updated: 2026-08-20

| Property | Class |
| --- | --- |
| Background | `bg-[#F1E8D5] dark:bg-[#223027]` |
| Border | metric cells use `border-t border-[#0D3B2A]/20 dark:border-white/15` |
| Border radius | none — kitchen notebook insert pattern |
| Text — primary | `text-[#0D3B2A] dark:text-white` |
| Text — secondary | `text-[#5B3E31] dark:text-[#B8D4BD]` |
| Spacing | panel `p-6`; metric grid `gap-x-7 gap-y-4` |
| Hover state | none |
| Shadow | none |
| Accent usage | leaf-green eyebrow; values remain dark ink/white |

**Pattern notes:** Always call nutrition an estimate. If calculation is partial, state that plainly without exposing internal matching metadata. Use per-serving values in the visible grid.
