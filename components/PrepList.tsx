"use client";

/** Prep-ahead steps for every meal planned this week. */

import { PantryCheckbox } from "@/components/PantryCheckbox";
import { Card } from "@/components/ui/card";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS } from "@/lib/types";

export function PrepList() {
  const { days, findRecipe, togglePrepStep } = useRecipro();

  const blocks = DAYS.flatMap((day) => {
    const assignment = days[day];
    if (!assignment) return [];
    const recipe = findRecipe(assignment.recipeId);
    if (!recipe || recipe.prepSteps.length === 0) return [];
    return [{ day, assignment, recipe }];
  });

  return (
    <section>
      <div className="mb-3">
        <h2 className="font-heading text-base font-medium text-foreground">Prep ahead</h2>
      </div>

      {blocks.length === 0 ? (
        <Card className="items-center px-6 text-center text-sm text-muted-foreground">
          Plan a meal above to see its prep-ahead steps here.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {blocks.map(({ day, assignment, recipe }) => (
            <Card key={day} className="px-4">
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-foreground">{recipe.name}</span>
                <span className="text-xs text-muted-foreground">— {day}</span>
              </div>
              <div>
                {recipe.prepSteps.map((step, index) => (
                  <PantryCheckbox
                    key={index}
                    checked={Boolean(assignment.prepDone?.[index])}
                    onChange={() => togglePrepStep(day, index)}
                    label={step}
                    strike
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
