/**
 * Application state and the only place that mutates it.
 *
 * Views read through the exported selectors, call the actions below, and
 * re-render when `subscribe`d listeners fire. Nothing outside this module
 * writes to `state`.
 */

import * as db from './db.js';
import { SEED_PANTRY, SEED_RECIPES, SEED_DAYS, emptyDays } from './seed.js';
import { THIS_WEEK_ID } from '../lib/dates.js';
import { genId } from '../lib/dom.js';

const clone = (value) => JSON.parse(JSON.stringify(value));

const state = {
  selectedWeekId: THIS_WEEK_ID,
  pantry: clone(SEED_PANTRY),
  recipes: clone(SEED_RECIPES),
  mealplan: { days: clone(SEED_DAYS) },
};

/** @type {Set<() => void>} */
const listeners = new Set();
/** @type {(() => void)|null} */
let unwatchWeek = null;

/**
 * Register a render callback. Returns an unsubscribe function.
 * @param {() => void} listener
 */
export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener();
}

/* ---------------- selectors ---------------- */

export const getWeekId = () => state.selectedWeekId;
export const getDays = () => state.mealplan.days;
export const getRecipes = () => state.recipes;
export const getPantry = () => state.pantry;

export const findRecipe = (id) => state.recipes.find((recipe) => recipe.id === id);

export function findPantryItemByName(name) {
  const needle = name.trim().toLowerCase();
  return state.pantry.find((item) => item.name.trim().toLowerCase() === needle);
}

/** An all-false prep checklist sized to the recipe's current step count. */
function freshPrepDone(recipeId) {
  const recipe = findRecipe(recipeId);
  return recipe ? recipe.prepSteps.map(() => false) : [];
}

/* ---------------- meal plan actions ---------------- */

/** Switch the visible week and re-point the live subscription at it. */
export function selectWeek(weekId) {
  unwatchWeek?.();
  unwatchWeek = null;
  state.selectedWeekId = weekId;

  if (!db.isConnected()) {
    state.mealplan = { days: emptyDays() };
    emit();
    return;
  }

  unwatchWeek = db.watchWeek(weekId, (mealplan) => {
    // A late snapshot from a week the user has already navigated away from.
    if (weekId !== state.selectedWeekId) return;

    if (mealplan) {
      state.mealplan = mealplan;
    } else {
      state.mealplan = { days: emptyDays() };
      db.saveWeek(weekId, state.mealplan.days);
    }
    emit();
  });
}

/** Assign a recipe to a day, or clear the day with `recipeId === null`. */
export function assignRecipe(day, recipeId) {
  state.mealplan.days[day] = recipeId
    ? { recipeId, prepDone: freshPrepDone(recipeId) }
    : null;
  emit();
  db.saveWeek(state.selectedWeekId, state.mealplan.days);
}

export function togglePrepStep(day, index) {
  const assignment = state.mealplan.days[day];
  if (!assignment) return;

  const prepDone = assignment.prepDone.slice();
  prepDone[index] = !prepDone[index];
  state.mealplan.days[day] = { recipeId: assignment.recipeId, prepDone };
  emit();
  db.saveWeek(state.selectedWeekId, state.mealplan.days);
}

/* ---------------- pantry actions ---------------- */

export function togglePantryHave(id) {
  const item = state.pantry.find((p) => p.id === id);
  if (!item) return;

  item.have = !item.have;
  emit();
  db.updatePantryItem(id, { have: item.have });
}

/**
 * Add a pantry item. Adding a name that already exists just restocks it
 * rather than creating a duplicate.
 */
export function addPantryItem(category, rawName, have = true) {
  const name = rawName.trim();
  if (!name) return;

  const existing = findPantryItemByName(name);
  if (existing) {
    if (!existing.have && have) togglePantryHave(existing.id);
    return;
  }

  const item = { id: genId(category === 'misc' ? 'misc' : 'ing'), name, category, have };
  state.pantry.push(item);
  emit();
  db.savePantryItem(item);
}

export function deletePantryItem(id) {
  state.pantry = state.pantry.filter((item) => item.id !== id);
  emit();
  db.deletePantryItem(id);
}

/* ---------------- recipe actions ---------------- */

/**
 * Create or update a recipe.
 * @param {string|null} id Existing recipe id, or null to create one.
 * @param {object} data Recipe fields without the id.
 */
export function saveRecipe(id, data) {
  const recipeId = id || genId('recipe');

  if (id) {
    const index = state.recipes.findIndex((recipe) => recipe.id === recipeId);
    if (index >= 0) state.recipes[index] = { id: recipeId, ...data };
  } else {
    state.recipes.push({ id: recipeId, ...data });
  }

  emit();
  db.saveRecipe(recipeId, data);
}

export function deleteRecipe(id) {
  state.recipes = state.recipes.filter((recipe) => recipe.id !== id);
  emit();
  db.deleteRecipe(id);
}

/* ---------------- startup ---------------- */

/**
 * Connect to the database and start live subscriptions. Falls back to the
 * in-memory seed data when no database is available.
 */
export async function init() {
  const connected = await db.connect();
  if (!connected) {
    emit();
    return;
  }

  db.watchPantry((pantry) => {
    state.pantry = pantry;
    emit();
  });
  db.watchRecipes((recipes) => {
    state.recipes = recipes;
    emit();
  });

  selectWeek(state.selectedWeekId);
}
