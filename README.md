# Recipro

Weekly Instant Pot meal planning — plan a week of meals, see what to buy for
them, and work through prep-ahead steps, including what needs doing the
night before.

Built with [Next.js](https://nextjs.org) (App Router, TypeScript), styled with
[Tailwind CSS](https://tailwindcss.com) and [shadcn/ui](https://ui.shadcn.com),
and persisted to [Supabase](https://supabase.com) (Postgres + Realtime).

## Setup

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com), then run the schema
against it (SQL Editor, or `supabase db push` if you use the CLI):

```bash
# in the Supabase SQL Editor, run in order:
supabase/schema.sql   # tables, triggers, RLS policies
supabase/seed.sql      # starter recipes and an example week (optional)
```

Upgrading an existing project? Run whichever of these apply:
- `supabase/migrate-drop-pantry.sql` — drops the unused `pantry_items` table
  from before the Pantry tab was removed (optional; harmless to leave it).
- `supabase/migrate-add-shopping-checked.sql` — adds the column that lets
  checked-off shopping list items persist (needed, or checking things off
  won't survive a refresh).

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your
project's **Settings → API** page. Both are safe to expose to the browser —
the app talks to Supabase directly from the client, and the anon key's access
is constrained by the RLS policies in `supabase/schema.sql`, not by secrecy.

### 3. Run

```bash
npm install
npm run dev
# open http://localhost:3000
```

`npm run build` produces a production build; `npm run lint` runs ESLint.

## Project structure

```
app/
  layout.tsx              Root layout: fonts, metadata, imports globals.css
  page.tsx                Renders <ReciproApp />
  globals.css             Tailwind + shadcn design tokens (light/dark)

components/
  ui/                      shadcn/ui primitives (button, card, dialog, sheet,
                            select, checkbox, tabs, alert-dialog, …) — owned
                            source, not a dependency. Regenerate/extend with
                            `npx shadcn@latest add <component>`.
  ReciproApp.tsx           Top-level shell: tabs, panels, the recipe editor
  Header.tsx               Brand + week picker
  Tabs.tsx                 Meal plan / Recipes tablist
  WeekView.tsx             The Kanban board of day columns
  ShoppingList.tsx         Every ingredient this week's meals need
  PrepList.tsx             Prep-ahead checklist, incl. night-before steps
  RecipesView.tsx          Recipe cards grid
  RecipeDialog.tsx         Markdown-based recipe viewer/editor, in a Sheet
  ChecklistRow.tsx         Checklist row (checkbox + label + optional strike)

lib/
  types.ts                 Shared domain types (Recipe, PrepStep, MealPlan, …)
  dates.ts                 Week ids, week ranges, the DAYS constant
  ingredient-name.ts       Strips prep-state words for the shopping list
  recipe-markdown.ts       Recipe ⇄ Markdown serializer/parser
  utils.ts                 shadcn's `cn()` class-merging helper
  recipro-context.tsx      All application state and the only module that
                            talks to Supabase — see "Data flow" below
  supabase/
    client.ts              Browser Supabase client
    rows.ts                snake_case row ↔ camelCase domain type mapping

supabase/
  schema.sql                Tables, triggers, RLS policies, realtime config
  seed.sql                   Starter recipes and an example week
  migrate-drop-pantry.sql    Optional cleanup for pre-Pantry-removal projects

components.json             shadcn/ui config (style, aliases, base color)
.env.local.example          Required environment variables
```

### Data flow

`ReciproProvider` (in `lib/recipro-context.tsx`) owns all state — recipes and
the selected week's meal plan — behind a `useRecipro()` hook. Views never call
Supabase directly:

1. A component calls an action from `useRecipro()` (`addMeal`, `moveMeal`,
   `saveRecipe`, …).
2. The action updates React state immediately (so the UI feels instant) and
   writes to Supabase in the background.
3. Supabase Realtime subscriptions (set up once, on mount) push any change —
   from this tab, another tab, or another device — back into the same state,
   so everything stays in sync automatically.

### Persistence

Two tables, defined in `supabase/schema.sql`:

| Table       | Purpose                                              |
| ----------- | ----------------------------------------------------- |
| `recipes`   | Name, cook time, servings, tags, ingredients, prep steps (each with a night-before flag), instructions |
| `mealplans` | One row per week (keyed by that week's Monday, e.g. `2026-09-07`), holding the list of recipes assigned to each day (a day can hold any number of meals), each one's prep checklist, and which shopping-list items are checked off |

There's no separate pantry/stock table — the shopping list is computed
directly from this week's planned meals' ingredients, deduplicated by plain
grocery-item name (see `lib/ingredient-name.ts`). Checking an item off is
saved to that week's `mealplans` row (`shopping_checked`) and syncs like
everything else.

Recipro has no login — it's a single household's planner, and the browser
talks to Supabase directly with the public anon key. Row Level Security is
enabled on both tables with policies that grant the anon role full access
(see the comment in `schema.sql`). That means anyone with the project URL and
anon key can read and write this data, which is an acceptable tradeoff for a
personal app — but if you ever add multiple households, swap those policies
for per-user ones keyed on `auth.uid()` before that ships.

## Recipes as Markdown

Opening a recipe shows a read-only detail view; **Edit recipe** switches to
a plain-text Markdown editor (`lib/recipe-markdown.ts`) instead of a
structured form. The format is fixed — `#` for the title, `**Label:**` lines
for tags/cook time/servings, `##` section headings, `-` for ingredients,
`1.` for prep steps — so keep those markers intact while editing the prose
around them. Add `(night before)` to the end of a prep step to flag it as
something to do the night before (e.g. `1. Soak rajma (night before)`); it
shows as a badge in the detail view and on the week's Prep ahead checklist.

## Styling

The design system is [shadcn/ui](https://ui.shadcn.com) on Tailwind CSS v4,
configured via `components.json`. Components under `components/ui/` are
owned source, not a package dependency — edit them directly, or add more
with `npx shadcn@latest add <component>`.

## Note on the original artifact

This project began as a single-file Claude Artifact (`recipro.html`) that
persisted through `window.claude.use("db")`. It's been rebuilt from scratch
as a standalone Next.js + Supabase app, so it can run and be deployed
anywhere — that Artifact-only database API no longer applies.
