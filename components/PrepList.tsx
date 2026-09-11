"use client";

/** Prep-ahead steps for every meal planned this week, one card per day. */

import { ChecklistRow } from "@/components/ChecklistRow";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS } from "@/lib/types";

export function PrepList() {
  const { days, findRecipe, togglePrepStep } = useRecipro();

  const dayGroups = DAYS.flatMap((day) => {
    const entries = days[day].flatMap((assignment) => {
      const recipe = findRecipe(assignment.recipeId);
      if (!recipe || recipe.prepSteps.length === 0) return [];
      return [{ assignment, recipe }];
    });
    return entries.length ? [{ day, entries }] : [];
  });

  return (
    <section>
      <div className="mb-3">
        <h2 className="font-heading text-base font-medium text-foreground">Prep ahead</h2>
      </div>

      {dayGroups.length === 0 ? (
        <Card className="items-center px-6 text-center text-sm text-muted-foreground">
          Plan a meal above to see its prep-ahead steps here.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {dayGroups.map(({ day, entries }) => (
            <Card key={day} className="px-4">
              <div className="mb-2 text-sm font-medium text-foreground">{day}</div>
              <div className="flex flex-col gap-4">
                {entries.map(({ assignment, recipe }) => (
                  <div key={assignment.id}>
                    <div className="mb-1 text-xs font-medium text-muted-foreground">{recipe.name}</div>
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
