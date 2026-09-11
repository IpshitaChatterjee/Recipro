"use client";

/**
 * The shopping list: every ingredient this week's planned meals need that the
 * pantry does not have, plus any household item marked out of stock.
 */

import { useMemo } from "react";
import { PantryCheckbox } from "@/components/PantryCheckbox";
import { Card } from "@/components/ui/card";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS } from "@/lib/types";

export function ShoppingList() {
  const { days, pantry, findRecipe, findPantryItemByName, togglePantryHave, addPantryItem } = useRecipro();

  const { needed, anyPlanned } = useMemo(() => {
    const needed = new Map<string, string[]>();
    let anyPlanned = false;

    for (const day of DAYS) {
      const assignment = days[day];
      if (!assignment) continue;
      const recipe = findRecipe(assignment.recipeId);
      if (!recipe) continue;
      anyPlanned = true;

      for (const ingredient of recipe.ingredients) {
        const pantryItem = findPantryItemByName(ingredient.name);
        if (pantryItem?.have) continue;

        if (!needed.has(ingredient.name)) needed.set(ingredient.name, []);
        const wantedBy = needed.get(ingredient.name)!;
        if (!wantedBy.includes(recipe.name)) wantedBy.push(recipe.name);
      }
    }

    return { needed, anyPlanned };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, pantry]);

  const household = pantry.filter((item) => item.category === "misc" && !item.have);
  const total = needed.size + household.length;

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
            ? "You have everything you need for this week."
            : "Nothing planned yet. Add meals to the days above and anything missing from your pantry will show up here."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {needed.size > 0 && (
            <Card className="px-4">
              <h3 className="mb-1 text-sm font-medium text-foreground">Ingredients</h3>
              <div>
                {[...needed].map(([name, wantedBy]) => (
                  <PantryCheckbox
                    key={name}
                    checked={false}
                    onChange={() => {
                      const pantryItem = findPantryItemByName(name);
                      if (pantryItem) togglePantryHave(pantryItem.id);
                      else addPantryItem("ingredient", name, true);
                    }}
                    label={name}
                    subText={`for ${wantedBy.join(", ")}`}
                  />
                ))}
              </div>
            </Card>
          )}
          {household.length > 0 && (
            <Card className="px-4">
              <h3 className="mb-1 text-sm font-medium text-foreground">Household</h3>
              <div>
                {household.map((item) => (
                  <PantryCheckbox
                    key={item.id}
                    checked={false}
                    onChange={() => togglePantryHave(item.id)}
                    label={item.name}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
