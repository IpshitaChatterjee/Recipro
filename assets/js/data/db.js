/**
 * Persistence layer.
 *
 * The app runs on the `window.claude` artifact runtime's Firestore-like `db`
 * capability. Every function here degrades to a no-op when that capability is
 * absent, so the UI still works (in-memory only) when opened as a plain file.
 */

import { omitId } from '../lib/dom.js';
import { SEED_PANTRY, SEED_RECIPES, SEED_DAYS } from './seed.js';
import { THIS_WEEK_ID } from '../lib/dates.js';

const COLLECTIONS = {
  pantry: 'pantry',
  recipes: 'recipes',
  mealplans: 'mealplans',
};

const SEED_DOC = 'meta/seed';
/** Pre-week-picker versions kept a single plan here. */
const LEGACY_MEALPLAN_DOC = 'mealplan/current';

/** @type {*} */
let db = null;

export const isConnected = () => db !== null;

/** Writes are fire-and-forget: the snapshot listeners reconcile any failure. */
const ignore = () => {};

/**
 * Connect to the artifact database, seeding and migrating it if needed.
 * Resolves to true when a live database is available.
 * @returns {Promise<boolean>}
 */
export async function connect() {
  if (!window.claude?.use) return false;

  try {
    const handle = await window.claude.use('db');
    if (!handle) return false;
    db = handle;
  } catch {
    return false;
  }

  try {
    const seedDoc = db.doc(SEED_DOC);
    const seeded = await seedDoc.get();
    if (seeded.exists) await migrateLegacyMealplan();
    else await seedDatabase(seedDoc);
  } catch {
    // Seeding is best-effort; an unseeded database still renders fine.
  }

  return true;
}

async function seedDatabase(seedDoc) {
  await Promise.all([
    ...SEED_PANTRY.map((item) => db.collection(COLLECTIONS.pantry).doc(item.id).set(omitId(item))),
    ...SEED_RECIPES.map((recipe) => db.collection(COLLECTIONS.recipes).doc(recipe.id).set(omitId(recipe))),
    db.collection(COLLECTIONS.mealplans).doc(THIS_WEEK_ID).set({ days: SEED_DAYS }),
  ]);
  await seedDoc.set({ seeded: true, seededAt: new Date().toISOString() });
}

/**
 * Fold a pre-week-picker plan into the current week so nothing already planned
 * is lost. No-op once the current week has its own document.
 */
async function migrateLegacyMealplan() {
  const weekRef = db.collection(COLLECTIONS.mealplans).doc(THIS_WEEK_ID);
  const existing = await weekRef.get();
  if (existing.exists) return;

  const legacy = await db.doc(LEGACY_MEALPLAN_DOC).get();
  if (legacy.exists && legacy.data()?.days) await weekRef.set({ days: legacy.data().days });
}

/** Map a snapshot to plain objects, folding the document id back into each. */
const withIds = (snap) => snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

/**
 * Watch the pantry collection.
 * @param {(items: object[]) => void} onChange
 */
export function watchPantry(onChange) {
  if (!db) return ignore;
  return db.collection(COLLECTIONS.pantry).onSnapshot((snap) => onChange(withIds(snap)), ignore);
}

/**
 * Watch the recipe collection.
 * @param {(recipes: object[]) => void} onChange
 */
export function watchRecipes(onChange) {
  if (!db) return ignore;
  return db.collection(COLLECTIONS.recipes).onSnapshot((snap) => onChange(withIds(snap)), ignore);
}

/**
 * Watch one week's meal plan, creating the document if it does not exist yet.
 * @param {string} weekId
 * @param {(mealplan: {days: object}|null) => void} onChange Receives null when
 *   the week has no document yet; the caller supplies the empty plan to create.
 * @returns {() => void} Unsubscribe.
 */
export function watchWeek(weekId, onChange) {
  if (!db) return ignore;
  const ref = db.collection(COLLECTIONS.mealplans).doc(weekId);
  return ref.onSnapshot((snap) => {
    onChange(snap.exists && snap.data()?.days ? snap.data() : null);
  }, ignore);
}

export function saveWeek(weekId, days) {
  db?.collection(COLLECTIONS.mealplans).doc(weekId).set({ days }).catch(ignore);
}

export function savePantryItem(item) {
  db?.collection(COLLECTIONS.pantry).doc(item.id).set(omitId(item)).catch(ignore);
}

export function updatePantryItem(id, fields) {
  db?.collection(COLLECTIONS.pantry).doc(id).update(fields).catch(ignore);
}

export function deletePantryItem(id) {
  db?.collection(COLLECTIONS.pantry).doc(id).delete().catch(ignore);
}

export function saveRecipe(id, data) {
  db?.collection(COLLECTIONS.recipes).doc(id).set(data).catch(ignore);
}

export function deleteRecipe(id) {
  db?.collection(COLLECTIONS.recipes).doc(id).delete().catch(ignore);
}
