"use client";

/** The recipe cards grid. Clicking a card opens it for editing. */

import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRecipro } from "@/lib/recipro-context";
import type { Recipe } from "@/lib/types";

function RecipeCard({ recipe, onOpen }: { recipe: Recipe; onOpen: () => void }) {
  const stepCount = recipe.prepSteps.length;

  return (
    <Card
      className="cursor-pointer px-4 transition-shadow hover:ring-2 hover:ring-ring/50"
      tabIndex={0}
      role="button"
      aria-label={`Edit ${recipe.name}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onOpen();
      }}
    >
      <h3 className="font-heading text-sm font-medium text-foreground">{recipe.name}</h3>
      {(recipe.tags || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <Badge variant="outline" key={tag}>
              {tag}
            </Badge>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>{recipe.cookTimeMin} min</span>
        <span>{recipe.ingredients.length} ingredients</span>
        <span>
          {stepCount} prep step{stepCount === 1 ? "" : "s"}
        </span>
      </div>
    </Card>
  );
}

export function RecipesView({
  onNewRecipe,
  onEditRecipe,
}: {
  onNewRecipe: () => void;
  onEditRecipe: (recipe: Recipe) => void;
}) {
  const { recipes } = useRecipro();

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-base font-medium text-foreground">Recipes</h2>
        <Button size="sm" onClick={onNewRecipe}>
          <Plus data-icon="inline-start" />
          New recipe
        </Button>
      </div>

      {recipes.length === 0 ? (
        <Card className="items-center px-6 text-center text-sm text-muted-foreground">
          <p>No recipes yet. Add your first Instant Pot recipe to start planning the week.</p>
          <Button size="sm" onClick={onNewRecipe} className="mt-2">
            New recipe
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onOpen={() => onEditRecipe(recipe)} />
          ))}
        </div>
      )}
    </section>
  );
}
