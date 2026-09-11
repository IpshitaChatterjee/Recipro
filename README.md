# Recipro

Weekly Instant Pot meal planning — plan a week of meals, see what your pantry is
missing, and work through prep-ahead steps.

## Running locally

The app uses native ES modules, which browsers refuse to load over `file://`.
Serve the directory over HTTP instead:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project structure

```
index.html                  Markup only — no inline CSS or JS
assets/css/styles.css       Design tokens, layout, components
assets/js/
  main.js                   Entry point: wires views to the store
  lib/dom.js                el(), clear(), icons, styled checkbox
  lib/dates.js              Week ids, week ranges, the DAYS constant
  data/seed.js              First-run pantry, recipes and example week
  data/db.js                Persistence — the only module that touches the database
  data/store.js             All application state; the only module that mutates it
  ui/tabs.js                ARIA tablist behaviour
  ui/week-picker.js         Header week <select>
  ui/week-view.js           The seven day cards
  ui/shopping-list.js       Missing ingredients + household items
  ui/prep-list.js           Prep-ahead checklist
  ui/recipes-view.js        Recipe cards grid
  ui/pantry-view.js         Stock lists and add forms
  ui/recipe-dialog.js       Add/edit recipe dialog
```

### Data flow

Dependencies run one way — `ui/* → data/store.js → data/db.js` — so there are no
import cycles.

1. A view calls an action on the store (`assignRecipe`, `togglePantryHave`, …).
2. The store updates state, notifies subscribers, and writes to the database.
3. `main.js` re-renders every view on each notification.
4. Database snapshots flow back through the store the same way, so changes made
   in another tab or by another person appear automatically.

### Persistence

Data lives in the `window.claude` artifact runtime's database capability
(collections: `pantry`, `recipes`, `mealplans`). Every write is fire-and-forget;
the live snapshot listeners reconcile any failure. When that capability is not
available the app still runs, backed by the in-memory seed data from
`data/seed.js`.

Meal plans are keyed by week id — the date of that week's Monday, e.g.
`2026-09-07`.

## Note on artifact publishing

`recipro.html` was a single self-contained file, which is what publishing as a
Claude Artifact requires. The split version here needs its sibling files, so to
publish it you would have to inline the CSS and JS back into one file first.
