"use client";

/** Prep-ahead steps for every meal planned this week. */

import { ChecklistRow } from "@/components/ChecklistRow";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS } from "@/lib/types";

export function PrepList() {
  const { days, findRecipe, togglePrepStep } = useRecipro();

  const blocks = DAYS.flatMap((day) =>
    days[day].flatMap((assignment) => {
      const recipe = findRecipe(assignment.recipeId);
      if (!recipe || recipe.prepSteps.length === 0) return [];
      return [{ day, assignment, recipe }];
    })
  );

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
            <Card key={assignment.id} className="px-4">
              <div className="mb-1 flex items-baseline gap-1.5">
                <span className="text-sm font-medium text-foreground">{recipe.name}</span>
                <span className="text-xs text-muted-foreground">— {day}</span>
              </div>
              <div>
                {recipe.prepSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <ChecklistRow
                      checked={Boolean(assignment.prepDone?.[index])}
                      onChange={() => togglePrepStep(day, assignment.id, index)}
                      label={step.text}
                      strike
                    />
                    {step.nightBefore && (
                      <Badge variant="secondary" className="shrink-0">
                        Night before
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
