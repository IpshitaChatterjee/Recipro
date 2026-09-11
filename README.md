# Recipro

Weekly Instant Pot meal planning — plan a week of meals, see what your pantry
is missing, and work through prep-ahead steps.

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
supabase/seed.sql      # starter pantry, recipes, and an example week (optional)
```

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
  Tabs.tsx                 This week / Recipes / Pantry tablist
  WeekView.tsx             The seven day cards
  ShoppingList.tsx         Missing ingredients + household items
  PrepList.tsx             Prep-ahead checklist
  RecipesView.tsx          Recipe cards grid
  PantryView.tsx           Stock lists and add forms
  RecipeDialog.tsx         Add/edit recipe form, in a slide-out Sheet
  PantryCheckbox.tsx       Checklist row (checkbox + label + optional strike)

lib/
  types.ts                 Shared domain types (PantryItem, Recipe, MealPlan, …)
  dates.ts                 Week ids, week ranges, the DAYS constant
  utils.ts                 shadcn's `cn()` class-merging helper
  recipro-context.tsx      All application state and the only module that
                            talks to Supabase — see "Data flow" below
  supabase/
    client.ts              Browser Supabase client
    rows.ts                snake_case row ↔ camelCase domain type mapping

supabase/
  schema.sql                Tables, triggers, RLS policies, realtime config
  seed.sql                   Starter pantry, recipes, and an example week

components.json             shadcn/ui config (style, aliases, base color)
.env.local.example          Required environment variables
```

### Data flow

`ReciproProvider` (in `lib/recipro-context.tsx`) owns all state — pantry,
recipes, and the selected week's meal plan — behind a `useRecipro()` hook.
Views never call Supabase directly:

1. A component calls an action from `useRecipro()` (`assignRecipe`,
   `togglePantryHave`, `saveRecipe`, …).
2. The action updates React state immediately (so the UI feels instant) and
   writes to Supabase in the background.
3. Supabase Realtime subscriptions (set up once, on mount) push any change —
   from this tab, another tab, or another device — back into the same state,
   so everything stays in sync automatically.

### Persistence

Three tables, defined in `supabase/schema.sql`:

| Table          | Purpose                                              |
| -------------- | ----------------------------------------------------- |
| `pantry_items` | Household items (manually managed) and ingredients (auto-synced from recipes — see below), and whether in stock |
| `recipes`      | Name, cook time, servings, tags, ingredients, prep steps, instructions |
| `mealplans`    | One row per week (keyed by that week's Monday, e.g. `2026-09-07`), holding the list of recipes assigned to each day (a day can hold any number of meals) and each one's prep checklist |

Pantry ingredients aren't added by hand: a sync effect in
`recipro-context.tsx` watches `recipes` and keeps exactly one pantry row per
distinct ingredient name used across all recipes, defaulting new ones to in
stock. An ingredient no longer used by any recipe is removed. Only household
items go through the add/remove UI in the Pantry tab.

Recipro has no login — it's a single household's planner, and the browser
talks to Supabase directly with the public anon key. Row Level Security is
enabled on all three tables with policies that grant the anon role full
access (see the comment in `schema.sql`). That means anyone with the project
URL and anon key can read and write this data, which is an acceptable
tradeoff for a personal app — but if you ever add multiple households, swap
those policies for per-user ones keyed on `auth.uid()` before that ships.

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
