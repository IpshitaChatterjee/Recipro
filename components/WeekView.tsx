"use client";

/** The seven day cards on the "This week" panel. Each day can hold any number of meals. */

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS, type Assignment, type Day, type Recipe } from "@/lib/types";

function MealRow({ day, assignment, recipe }: { day: Day; assignment: Assignment; recipe: Recipe }) {
  const { removeMeal } = useRecipro();
  const prepDone = assignment.prepDone || [];
  const noPrep = recipe.prepSteps.length === 0;
  const allDone = noPrep || prepDone.filter(Boolean).length === recipe.prepSteps.length;

  return (
    <div className="flex items-start justify-between gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-1.5">
        <div className="font-heading text-sm font-medium text-foreground">{recipe.name}</div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{recipe.cookTimeMin} min IP</Badge>
          <Badge variant={allDone ? "secondary" : "outline"} className={allDone ? "" : "text-muted-foreground"}>
            {noPrep ? "No prep" : allDone ? "Prep done" : "Prep needed"}
          </Badge>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${recipe.name} from ${day}`}
        onClick={() => removeMeal(day, assignment.id)}
      >
        <X />
      </Button>
    </div>
  );
}

function DayCard({ day }: { day: Day }) {
  const { days, recipes, findRecipe, addMeal } = useRecipro();
  const assignments = days[day];

  return (
    <Card size="sm" className="gap-3 px-4">
      <div className="text-xs font-medium text-muted-foreground">{day}</div>

      {assignments.length === 0 ? (
        <div className="text-sm text-muted-foreground">No meal planned</div>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((assignment) => {
            const recipe = findRecipe(assignment.recipeId);
            return recipe ? <MealRow key={assignment.id} day={day} assignment={assignment} recipe={recipe} /> : null;
          })}
        </div>
      )}

      <Select
        items={recipes.map((r) => ({ value: r.id, label: r.name }))}
        value=""
        onValueChange={(recipeId) => recipeId && addMeal(day, recipeId)}
      >
        <SelectTrigger aria-label={`Add a meal for ${day}`} className="w-full">
          <SelectValue placeholder="Add a meal…" />
        </SelectTrigger>
        <SelectContent>
          {recipes.map((recipe) => (
            <SelectItem key={recipe.id} value={recipe.id}>
              {recipe.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
}

export function WeekView() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DAYS.map((day) => (
        <DayCard key={day} day={day} />
      ))}
    </div>
  );
}
