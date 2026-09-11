/**
 * Mapping between Supabase's snake_case row shape and the app's camelCase
 * domain types (lib/types.ts). Keeping this in one place means a schema
 * column rename only touches this file.
 */

import {
  normalizeDays,
  normalizeShoppingChecked,
  type Ingredient,
  type MealPlan,
  type PrepStep,
  type Recipe,
  type RecipeInput,
} from "@/lib/types";

export interface RecipeRow {
  id: string;
  name: string;
  cook_time_min: number;
  servings: number;
  tags: string[];
  ingredients: Ingredient[];
  /** `unknown` because older rows stored steps as plain strings — normalizePrepSteps() upgrades those. */
  prep_steps: unknown;
  instructions: string;
}

/** Upgrades prep steps saved before the night-before tag existed (plain strings) to the current shape. */
function normalizePrepSteps(raw: unknown): PrepStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): PrepStep | null => {
      if (typeof entry === "string") return entry ? { text: entry, nightBefore: false } : null;
      if (entry && typeof entry === "object" && typeof (entry as { text?: unknown }).text === "string") {
        const step = entry as { text: string; nightBefore?: unknown };
        return { text: step.text, nightBefore: Boolean(step.nightBefore) };
      }
      return null;
    })
    .filter((step): step is PrepStep => step !== null);
}

export function recipeFromRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    name: row.name,
    cookTimeMin: row.cook_time_min,
    servings: row.servings,
    tags: row.tags ?? [],
    ingredients: row.ingredients ?? [],
    prepSteps: normalizePrepSteps(row.prep_steps),
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
  /** `unknown` because rows saved before this column existed won't have it. */
  shopping_checked?: unknown;
}

export function mealPlanFromRow(row: MealPlanRow): MealPlan {
  return {
    weekId: row.week_id,
    days: normalizeDays(row.days),
    shoppingChecked: normalizeShoppingChecked(row.shopping_checked),
  };
}
