"use client";

/**
 * The shopping list: every ingredient this week's planned meals need,
 * deduplicated by its plain grocery-item name. Checked-off items are saved
 * per week (`shoppingChecked`) and sync like everything else in the app.
 */

import { useMemo } from "react";
import { ChecklistRow } from "@/components/ChecklistRow";
import { Card } from "@/components/ui/card";
import { normalizeIngredientName } from "@/lib/ingredient-name";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS } from "@/lib/types";

export function ShoppingList() {
  const { days, findRecipe, shoppingChecked, toggleShoppingItem } = useRecipro();

  const { needed, anyPlanned } = useMemo(() => {
    const needed = new Map<string, string[]>();
    let anyPlanned = false;

    for (const day of DAYS) {
      for (const assignment of days[day]) {
        const recipe = findRecipe(assignment.recipeId);
        if (!recipe) continue;
        anyPlanned = true;

        for (const ingredient of recipe.ingredients) {
          const name = normalizeIngredientName(ingredient.name);
          if (!needed.has(name)) needed.set(name, []);
          const wantedBy = needed.get(name)!;
          if (!wantedBy.includes(recipe.name)) wantedBy.push(recipe.name);
        }
      }
    }

    return { needed, anyPlanned };
  }, [days, findRecipe]);

  const checkedSet = useMemo(() => new Set(shoppingChecked), [shoppingChecked]);

  // Checked-off items sink to the bottom, so what's still needed stays at
  // the top; each group otherwise keeps the order it was found in.
  const ordered = useMemo(
    () => [...needed].sort(([a], [b]) => Number(checkedSet.has(a)) - Number(checkedSet.has(b))),
    [needed, checkedSet]
  );

  const total = needed.size;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="font-heading text-base font-medium text-foreground">Shopping list</h2>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            {total} item{total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {total === 0 ? (
        <Card className="items-center px-6 text-center text-sm text-muted-foreground">
          {anyPlanned
            ? "No ingredients needed — every planned meal this week has none listed."
            : "Nothing planned yet. Add meals to the days above and everything they need will show up here."}
        </Card>
      ) : (
        <Card className="px-4">
          <div className="columns-1 gap-x-8 sm:columns-2 lg:columns-3">
            {ordered.map(([name, wantedBy]) => (
              <div key={name} className="break-inside-avoid">
                <ChecklistRow
                  checked={checkedSet.has(name)}
                  onChange={() => toggleShoppingItem(name)}
                  label={name}
                  subText={`for ${wantedBy.join(", ")}`}
                  strike
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </section>
  );
}
