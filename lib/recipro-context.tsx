"use client";

/**
 * Application state and the only place that talks to Supabase.
 *
 * This mirrors the previous vanilla-JS store: one place owns state and
 * mutates it, everything else reads it through `useRecipro()` and calls its
 * actions. Realtime subscriptions keep every open tab in sync.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { mealPlanFromRow, pantryItemFromRow, recipeFromRow, recipeToRow } from "@/lib/supabase/rows";
import { THIS_WEEK_ID } from "@/lib/dates";
import { normalizeIngredientName } from "@/lib/ingredient-name";
import {
  emptyDays,
  newAssignment,
  normalizeDays,
  type Assignment,
  type Day,
  type Days,
  type MealSlot,
  type PantryCategory,
  type Recipe,
  type RecipeInput,
} from "@/lib/types";

interface ReciproState {
  loading: boolean;
  /** Set once the initial load fails, e.g. missing/invalid Supabase env vars. */
  error: string | null;
  selectedWeekId: string;
  days: Days;
  recipes: Recipe[];
  pantry: import("@/lib/types").PantryItem[];
}

interface ReciproActions {
  selectWeek: (weekId: string) => void;
  addMeal: (day: Day, recipeId: string, mealSlot: MealSlot) => void;
  removeMeal: (day: Day, assignmentId: string) => void;
  moveMeal: (fromDay: Day, assignmentId: string, toDay: Day, toSlot: MealSlot, toIndex: number) => void;
  togglePrepStep: (day: Day, assignmentId: string, index: number) => void;
  togglePantryHave: (id: string) => void;
  addPantryItem: (category: PantryCategory, name: string, have?: boolean) => void;
  deletePantryItem: (id: string) => void;
  saveRecipe: (id: string | null, data: RecipeInput) => void;
  deleteRecipe: (id: string) => void;
  findRecipe: (id: string) => Recipe | undefined;
  findPantryItemByName: (name: string) => import("@/lib/types").PantryItem | undefined;
}

type ReciproContextValue = ReciproState & ReciproActions;

const ReciproContext = createContext<ReciproContextValue | null>(null);

/**
 * Writes are fire-and-forget so the UI updates instantly from local state —
 * but that means a failed write (bad RLS policy, missing table, wrong
 * project) fails *silently*: the screen looks right until the next reload
 * pulls the database's actual (unchanged) data back down. Logging every
 * failure here turns that into a visible, diagnosable console error instead.
 */
function logIfFailed(action: string) {
  return ({ error }: { error: { message: string } | null }) => {
    if (error) console.error(`[Recipro] ${action} failed — this change was NOT saved:`, error.message);
  };
}

export function ReciproProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState(THIS_WEEK_ID);
  const [days, setDays] = useState<Days>(emptyDays());
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [pantry, setPantry] = useState<import("@/lib/types").PantryItem[]>([]);

  // Kept in a ref so the realtime mealplan callback (subscribed once, see
  // below) always checks the *current* selection without needing to
  // resubscribe every time the user switches weeks.
  const selectedWeekIdRef = useRef(selectedWeekId);
  useEffect(() => {
    selectedWeekIdRef.current = selectedWeekId;
  }, [selectedWeekId]);

  const findRecipe = useCallback((id: string) => recipes.find((r) => r.id === id), [recipes]);
  const findPantryItemByName = useCallback(
    (name: string) => {
      // Accepts either a pantry item's own name or a raw recipe ingredient
      // name ("Dried chickpeas") — normalizing here matches it to the
      // pantry's plain grocery-item name ("Chickpeas") either way.
      const needle = normalizeIngredientName(name).toLowerCase();
      return pantry.find((item) => item.name.trim().toLowerCase() === needle);
    },
    [pantry]
  );

  /** Load one week's plan, creating an empty row if none exists yet. */
  const loadWeek = useCallback(
    async (weekId: string) => {
      const { data, error: fetchError } = await supabase
        .from("mealplans")
        .select("week_id, days")
        .eq("week_id", weekId)
        .maybeSingle();

      if (weekId !== selectedWeekIdRef.current) return; // navigated away while loading
      if (fetchError) return;

      if (data) {
        setDays(mealPlanFromRow(data).days);
      } else {
        const fresh = emptyDays();
        setDays(fresh);
        await supabase.from("mealplans").insert({ week_id: weekId, days: fresh }).then(logIfFailed("create this week's meal plan"));
      }
    },
    [supabase]
  );

  // Initial load: pantry, recipes, and the starting week, plus realtime
  // subscriptions so other tabs/devices stay in sync.
  useEffect(() => {
    let cancelled = false;
    const channels: RealtimeChannel[] = [];

    async function init() {
      const [{ data: pantryRows, error: pantryErr }, { data: recipeRows, error: recipeErr }] = await Promise.all([
        supabase.from("pantry_items").select("*"),
        supabase.from("recipes").select("*"),
      ]);

      if (cancelled) return;

      if (pantryErr || recipeErr) {
        setError((pantryErr ?? recipeErr)!.message);
        setLoading(false);
        return;
      }

      setPantry((pantryRows ?? []).map(pantryItemFromRow));
      setRecipes((recipeRows ?? []).map(recipeFromRow));
      await loadWeek(selectedWeekIdRef.current);
      if (!cancelled) setLoading(false);

      channels.push(
        supabase
          .channel("pantry_items-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "pantry_items" }, () => {
            supabase
              .from("pantry_items")
              .select("*")
              .then(({ data }) => data && setPantry(data.map(pantryItemFromRow)));
          })
          .subscribe(),

        supabase
          .channel("recipes-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "recipes" }, () => {
            supabase
              .from("recipes")
              .select("*")
              .then(({ data }) => data && setRecipes(data.map(recipeFromRow)));
          })
          .subscribe(),

        supabase
          .channel("mealplans-changes")
          .on("postgres_changes", { event: "*", schema: "public", table: "mealplans" }, (payload) => {
            const row = payload.new as { week_id?: string; days?: unknown } | null;
            if (row?.week_id === selectedWeekIdRef.current && row.days) setDays(normalizeDays(row.days));
          })
          .subscribe()
      );
    }

    init();

    return () => {
      cancelled = true;
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
    // Intentionally runs once: `loadWeek` and `supabase` are stable for the
    // provider's lifetime, and re-running this on every render would tear
    // down and rebuild the realtime channels needlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectWeek = useCallback(
    (weekId: string) => {
      setSelectedWeekId(weekId);
      loadWeek(weekId);
    },
    [loadWeek]
  );

  // Names with an add/remove currently in flight, so a second effect run
  // before Realtime echoes the write back (see below) doesn't fire a
  // duplicate — e.g. editing a recipe's ingredients row by row can re-run
  // this effect several times before the first write round-trips.
  const pendingIngredientSyncRef = useRef<Set<string>>(new Set());

  // Keep the pantry's ingredient rows in sync with what the recipes actually
  // use: every distinct ingredient name across all recipes gets exactly one
  // pantry row (in stock by default — new ingredients aren't assumed to be
  // missing), and ingredient rows no longer used by any recipe are removed.
  // Household/misc items are untouched; those stay manually managed. Skipped
  // until the initial load finishes so this can't run against an empty
  // recipes list and wipe out pantry ingredients before they've arrived.
  //
  // No optimistic local setPantry here: the pantry_items realtime
  // subscription (above) already re-fetches and updates state for any
  // change, including ones this same write makes.
  useEffect(() => {
    if (loading) return;
    const pending = pendingIngredientSyncRef.current;

    const used = new Map<string, string>(); // lowercase normalized name -> its display casing
    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        if (!ingredient.name.trim()) continue;
        const normalized = normalizeIngredientName(ingredient.name);
        const key = normalized.toLowerCase();
        if (!used.has(key)) used.set(key, normalized);
      }
    }

    const existingIngredients = pantry.filter((item) => item.category === "ingredient");
    const existingNames = new Set(existingIngredients.map((item) => item.name.trim().toLowerCase()));

    for (const [key, name] of used) {
      if (existingNames.has(key) || pending.has(key)) continue;
      pending.add(key);
      supabase
        .from("pantry_items")
        .insert({ id: `ing-${crypto.randomUUID().slice(0, 8)}`, name, category: "ingredient", have: true })
        .then(logIfFailed("add pantry ingredient"))
        .then(() => pending.delete(key));
    }

    for (const item of existingIngredients) {
      const key = item.name.trim().toLowerCase();
      if (used.has(key) || pending.has(key)) continue;
      pending.add(key);
      supabase
        .from("pantry_items")
        .delete()
        .eq("id", item.id)
        .then(logIfFailed("remove pantry ingredient"))
        .then(() => pending.delete(key));
    }
  }, [recipes, pantry, loading, supabase]);

  const saveDays = useCallback(
    (next: Days) => {
      setDays(next);
      supabase
        .from("mealplans")
        .update({ days: next })
        .eq("week_id", selectedWeekIdRef.current)
        .then(logIfFailed("save meal plan"));
    },
    [supabase]
  );

  const addMeal = useCallback(
    (day: Day, recipeId: string, mealSlot: MealSlot) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      const assignment = newAssignment(recipeId, recipe?.prepSteps.length ?? 0, mealSlot);
      saveDays({ ...days, [day]: [...days[day], assignment] });
    },
    [days, recipes, saveDays]
  );

  const removeMeal = useCallback(
    (day: Day, assignmentId: string) => {
      saveDays({ ...days, [day]: days[day].filter((a) => a.id !== assignmentId) });
    },
    [days, saveDays]
  );

  /**
   * Move (or reorder) a meal, possibly into a different meal slot. `toIndex`
   * is clamped and only orders items within the destination slot — passing
   * something like `Infinity` is a convenient way to say "drop at the end".
   */
  const moveMeal = useCallback(
    (fromDay: Day, assignmentId: string, toDay: Day, toSlot: MealSlot, toIndex: number) => {
      const original = days[fromDay].find((a) => a.id === assignmentId);
      if (!original) return;
      const moved: Assignment = { ...original, mealSlot: toSlot };

      const fromRest = days[fromDay].filter((a) => a.id !== assignmentId);
      const toBase = fromDay === toDay ? fromRest : days[toDay];

      const destSlot = toBase.filter((a) => a.mealSlot === toSlot);
      const destOther = toBase.filter((a) => a.mealSlot !== toSlot);
      const clampedIndex = Math.max(0, Math.min(toIndex, destSlot.length));
      const newDestSlot = [...destSlot.slice(0, clampedIndex), moved, ...destSlot.slice(clampedIndex)];

      const next: Days = { ...days };
      next[fromDay] = fromRest;
      next[toDay] = [...destOther, ...newDestSlot];
      saveDays(next);
    },
    [days, saveDays]
  );

  const togglePrepStep = useCallback(
    (day: Day, assignmentId: string, index: number) => {
      saveDays({
        ...days,
        [day]: days[day].map((assignment) => {
          if (assignment.id !== assignmentId) return assignment;
          const prepDone = assignment.prepDone.slice();
          prepDone[index] = !prepDone[index];
          return { ...assignment, prepDone };
        }),
      });
    },
    [days, saveDays]
  );

  const togglePantryHave = useCallback(
    (id: string) => {
      const item = pantry.find((p) => p.id === id);
      if (!item) return;
      const have = !item.have;
      setPantry((prev) => prev.map((p) => (p.id === id ? { ...p, have } : p)));
      supabase.from("pantry_items").update({ have }).eq("id", id).then(logIfFailed("update pantry item"));
    },
    [pantry, supabase]
  );

  const addPantryItem = useCallback(
    (category: PantryCategory, rawName: string, have = true) => {
      const name = rawName.trim();
      if (!name) return;

      const existing = findPantryItemByName(name);
      if (existing) {
        if (!existing.have && have) togglePantryHave(existing.id);
        return;
      }

      const id = `${category === "misc" ? "misc" : "ing"}-${crypto.randomUUID().slice(0, 8)}`;
      const item = { id, name, category, have };
      setPantry((prev) => [...prev, item]);
      supabase.from("pantry_items").insert(item).then(logIfFailed("add pantry item"));
    },
    [findPantryItemByName, supabase, togglePantryHave]
  );

  const deletePantryItem = useCallback(
    (id: string) => {
      setPantry((prev) => prev.filter((item) => item.id !== id));
      supabase.from("pantry_items").delete().eq("id", id).then(logIfFailed("delete pantry item"));
    },
    [supabase]
  );

  const saveRecipe = useCallback(
    (id: string | null, data: RecipeInput) => {
      const recipeId = id ?? `recipe-${crypto.randomUUID().slice(0, 8)}`;
      const recipe: Recipe = { id: recipeId, ...data };

      setRecipes((prev) => (id ? prev.map((r) => (r.id === id ? recipe : r)) : [...prev, recipe]));
      supabase
        .from("recipes")
        .upsert({ id: recipeId, ...recipeToRow(data) })
        .then(logIfFailed("save recipe"));
    },
    [supabase]
  );

  const deleteRecipe = useCallback(
    (id: string) => {
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      supabase.from("recipes").delete().eq("id", id).then(logIfFailed("delete recipe"));
    },
    [supabase]
  );

  const value: ReciproContextValue = {
    loading,
    error,
    selectedWeekId,
    days,
    recipes,
    pantry,
    selectWeek,
    addMeal,
    removeMeal,
    moveMeal,
    togglePrepStep,
    togglePantryHave,
    addPantryItem,
    deletePantryItem,
    saveRecipe,
    deleteRecipe,
    findRecipe,
    findPantryItemByName,
  };

  return <ReciproContext.Provider value={value}>{children}</ReciproContext.Provider>;
}

export function useRecipro() {
  const ctx = useContext(ReciproContext);
  if (!ctx) throw new Error("useRecipro must be used within a ReciproProvider");
  return ctx;
}
