"use client";

/**
 * The shopping list: every ingredient this week's planned meals need,
 * deduplicated by its plain grocery-item name. There's no stock tracking —
 * checking an item off just crosses it out for this viewing session (not
 * persisted, not shared across tabs/devices).
 */

import { useMemo, useState } from "react";
import { ChecklistRow } from "@/components/ChecklistRow";
import { Card } from "@/components/ui/card";
import { normalizeIngredientName } from "@/lib/ingredient-name";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS } from "@/lib/types";

export function ShoppingList() {
  const { days, findRecipe } = useRecipro();
  const [checkedOff, setCheckedOff] = useState<Set<string>>(new Set());

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

  function toggle(name: string) {
    setCheckedOff((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  // Checked-off items sink to the bottom, so what's still needed stays at
  // the top; each group otherwise keeps the order it was found in.
  const ordered = useMemo(
    () => [...needed].sort(([a], [b]) => Number(checkedOff.has(a)) - Number(checkedOff.has(b))),
    [needed, checkedOff]
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
                  checked={checkedOff.has(name)}
                  onChange={() => toggle(name)}
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
