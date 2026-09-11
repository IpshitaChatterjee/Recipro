"use client";

/** The seven day cards on the "This week" panel. */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecipro } from "@/lib/recipro-context";
import { DAYS, type Assignment, type Day, type Recipe } from "@/lib/types";

function PlannedCard({ day, assignment, recipe }: { day: Day; assignment: Assignment; recipe: Recipe }) {
  const { assignRecipe } = useRecipro();
  const prepDone = assignment.prepDone || [];
  const noPrep = recipe.prepSteps.length === 0;
  const allDone = noPrep || prepDone.filter(Boolean).length === recipe.prepSteps.length;

  return (
    <Card size="sm" className="gap-3 px-4">
      <div className="text-xs font-medium text-muted-foreground">{day}</div>
      <div className="font-heading text-sm font-medium text-foreground">{recipe.name}</div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline">{recipe.cookTimeMin} min IP</Badge>
        <Badge variant={allDone ? "secondary" : "outline"} className={allDone ? "" : "text-muted-foreground"}>
          {noPrep ? "No prep" : allDone ? "Prep done" : "Prep needed"}
        </Badge>
      </div>
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" onClick={() => assignRecipe(day, null)}>
        Clear
      </Button>
    </Card>
  );
}

function EmptyCard({ day }: { day: Day }) {
  const { recipes, assignRecipe } = useRecipro();

  return (
    <Card size="sm" className="gap-3 px-4">
      <div className="text-xs font-medium text-muted-foreground">{day}</div>
      <div className="text-sm text-muted-foreground">No meal planned</div>
      <Select
        items={recipes.map((r) => ({ value: r.id, label: r.name }))}
        value=""
        onValueChange={(recipeId) => assignRecipe(day, recipeId)}
      >
        <SelectTrigger aria-label={`Plan a meal for ${day}`} className="w-full">
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
  const { days, findRecipe } = useRecipro();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {DAYS.map((day) => {
        const assignment = days[day];
        const recipe = assignment ? findRecipe(assignment.recipeId) : null;
        return recipe && assignment ? (
          <PlannedCard key={day} day={day} assignment={assignment} recipe={recipe} />
        ) : (
          <EmptyCard key={day} day={day} />
        );
      })}
    </div>
  );
}
