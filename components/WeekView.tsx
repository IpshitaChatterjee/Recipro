"use client";

/**
 * A Kanban-style board for the week: one column per day, each holding a
 * stack of recipe cards. Columns scroll horizontally on narrow screens
 * rather than reflowing, so every day stays a fixed, easy-to-scan width.
 */

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS, type Assignment, type Day, type Recipe } from "@/lib/types";

function MealCard({ day, assignment, recipe }: { day: Day; assignment: Assignment; recipe: Recipe }) {
  const { removeMeal } = useRecipro();

  return (
    <Card size="sm" className="gap-1.5 px-3">
      <div className="flex items-start justify-between gap-2">
        <div className="font-heading text-sm font-medium text-foreground">{recipe.name}</div>
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mt-1 -mr-1 shrink-0"
          aria-label={`Remove ${recipe.name} from ${day}`}
          onClick={() => removeMeal(day, assignment.id)}
        >
          <X />
        </Button>
      </div>
      <Badge variant="outline" className="w-fit">
        {recipe.cookTimeMin} min IP
      </Badge>
    </Card>
  );
}

function DayColumn({ day }: { day: Day }) {
  const { days, recipes, findRecipe, addMeal } = useRecipro();
  const assignments = days[day];

  return (
    <div className="flex w-64 shrink-0 flex-col gap-3 rounded-2xl bg-muted/50 p-3">
      <div className="px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{day}</div>

      {assignments.length > 0 && (
        <div className="flex flex-col gap-2">
          {assignments.map((assignment) => {
            const recipe = findRecipe(assignment.recipeId);
            return recipe ? <MealCard key={assignment.id} day={day} assignment={assignment} recipe={recipe} /> : null;
          })}
        </div>
      )}

      <Select
        items={recipes.map((r) => ({ value: r.id, label: r.name }))}
        value=""
        onValueChange={(recipeId) => recipeId && addMeal(day, recipeId)}
      >
        <SelectTrigger aria-label={`Add a meal for ${day}`} className="w-full bg-background">
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
    </div>
  );
}

export function WeekView() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {DAYS.map((day) => (
        <DayColumn key={day} day={day} />
      ))}
    </div>
  );
}
