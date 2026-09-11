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
  /** Unique per assignment (not per recipe) — a day can have the same recipe twice. */
  id: string;
  recipeId: string;
  /** One entry per prep step on the assigned recipe, true once checked off. */
  prepDone: boolean[];
}

/** A day can have any number of meals planned, including none. */
export type Days = Record<Day, Assignment[]>;

export interface MealPlan {
  /** The Monday of the week, e.g. "2026-09-07" — also the row's primary key. */
  weekId: string;
  days: Days;
}

export function emptyDays(): Days {
  return { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] };
}

const genAssignmentId = () => `a-${crypto.randomUUID().slice(0, 8)}`;

/**
 * Coerce whatever shape a `days` value has into the current one. Handles two
 * older shapes this column has held: `null` for an empty day, and a single
 * assignment object (no `id`, one meal per day) instead of an array — so
 * meal plans saved before multi-meal support was added still load instead of
 * erroring or silently losing data.
 */
export function normalizeDays(raw: unknown): Days {
  const days = emptyDays();
  if (!raw || typeof raw !== "object") return days;

  for (const day of DAYS) {
    const value = (raw as Record<string, unknown>)[day];
    if (Array.isArray(value)) {
      days[day] = value.map((entry) => normalizeAssignment(entry)).filter((a): a is Assignment => a !== null);
    } else if (value && typeof value === "object") {
      const assignment = normalizeAssignment(value);
      days[day] = assignment ? [assignment] : [];
    }
  }
  return days;
}

function normalizeAssignment(entry: unknown): Assignment | null {
  if (!entry || typeof entry !== "object") return null;
  const { id, recipeId, prepDone } = entry as Partial<Assignment>;
  if (typeof recipeId !== "string") return null;
  return {
    id: typeof id === "string" ? id : genAssignmentId(),
    recipeId,
    prepDone: Array.isArray(prepDone) ? prepDone.map(Boolean) : [],
  };
}

export function newAssignment(recipeId: string, prepStepCount: number): Assignment {
  return { id: genAssignmentId(), recipeId, prepDone: new Array(prepStepCount).fill(false) };
}
