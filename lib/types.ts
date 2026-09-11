/** Shared domain types, mirroring the Supabase schema in supabase/schema.sql. */

export type PantryCategory = "ingredient" | "misc";

export interface PantryItem {
  id: string;
  name: string;
  category: PantryCategory;
  have: boolean;
}

export interface Ingredient {
  name: string;
  qty: string;
}

export interface Recipe {
  id: string;
  name: string;
  cookTimeMin: number;
  servings: number;
  tags: string[];
  ingredients: Ingredient[];
  prepSteps: string[];
  instructions: string;
}

/** Fields needed to create or update a recipe (no id — the server assigns one). */
export type RecipeInput = Omit<Recipe, "id">;

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];

export interface Assignment {
  recipeId: string;
  /** One entry per prep step on the assigned recipe, true once checked off. */
  prepDone: boolean[];
}

export type Days = Record<Day, Assignment | null>;

export interface MealPlan {
  /** The Monday of the week, e.g. "2026-09-07" — also the row's primary key. */
  weekId: string;
  days: Days;
}

export function emptyDays(): Days {
  return { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null, Sun: null };
}
