/**
 * Mapping between Supabase's snake_case row shape and the app's camelCase
 * domain types (lib/types.ts). Keeping this in one place means a schema
 * column rename only touches this file.
 */

import { normalizeDays, type Ingredient, type MealPlan, type PantryItem, type Recipe, type RecipeInput } from "@/lib/types";

export interface PantryItemRow {
  id: string;
  name: string;
  category: "ingredient" | "misc";
  have: boolean;
}

export function pantryItemFromRow(row: PantryItemRow): PantryItem {
  return { id: row.id, name: row.name, category: row.category, have: row.have };
}

export interface RecipeRow {
  id: string;
  name: string;
  cook_time_min: number;
  servings: number;
  tags: string[];
  ingredients: Ingredient[];
  prep_steps: string[];
  instructions: string;
}

export function recipeFromRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    cookTimeMin: row.cook_time_min,
    servings: row.servings,
    tags: row.tags ?? [],
    ingredients: row.ingredients ?? [],
    prepSteps: row.prep_steps ?? [],
    instructions: row.instructions ?? "",
  };
}

export function recipeToRow(data: RecipeInput) {
  return {
    name: data.name,
    cook_time_min: data.cookTimeMin,
    servings: data.servings,
    tags: data.tags,
    ingredients: data.ingredients,
    prep_steps: data.prepSteps,
    instructions: data.instructions,
  };
}

export interface MealPlanRow {
  week_id: string;
  /** `unknown` because older rows stored `days` in a shape normalizeDays() upgrades. */
  days: unknown;
}

export function mealPlanFromRow(row: MealPlanRow): MealPlan {
  return { weekId: row.week_id, days: normalizeDays(row.days) };
}
