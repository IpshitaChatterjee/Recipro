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
import { emptyDays, type Day, type Days, type PantryCategory, type Recipe, type RecipeInput } from "@/lib/types";

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
  assignRecipe: (day: Day, recipeId: string | null) => void;
  togglePrepStep: (day: Day, index: number) => void;
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

/** An all-false prep checklist sized to the recipe's current step count. */
function freshPrepDone(recipes: Recipe[], recipeId: string) {
  const recipe = recipes.find((r) => r.id === recipeId);
  return recipe ? recipe.prepSteps.map(() => false) : [];
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
      const needle = name.trim().toLowerCase();
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
        await supabase.from("mealplans").insert({ week_id: weekId, days: fresh });
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
            const row = payload.new as { week_id?: string; days?: Days } | null;
            if (row?.week_id === selectedWeekIdRef.current && row.days) setDays(row.days);
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

  const assignRecipe = useCallback(
    (day: Day, recipeId: string | null) => {
      const next: Days = {
        ...days,
        [day]: recipeId ? { recipeId, prepDone: freshPrepDone(recipes, recipeId) } : null,
      };
      setDays(next);
      supabase.from("mealplans").update({ days: next }).eq("week_id", selectedWeekIdRef.current);
    },
    [days, recipes, supabase]
  );

  const togglePrepStep = useCallback(
    (day: Day, index: number) => {
      const assignment = days[day];
      if (!assignment) return;
      const prepDone = assignment.prepDone.slice();
      prepDone[index] = !prepDone[index];
      const next: Days = { ...days, [day]: { recipeId: assignment.recipeId, prepDone } };
      setDays(next);
      supabase.from("mealplans").update({ days: next }).eq("week_id", selectedWeekIdRef.current);
    },
    [days, supabase]
  );

  const togglePantryHave = useCallback(
    (id: string) => {
      const item = pantry.find((p) => p.id === id);
      if (!item) return;
      const have = !item.have;
      setPantry((prev) => prev.map((p) => (p.id === id ? { ...p, have } : p)));
      supabase.from("pantry_items").update({ have }).eq("id", id);
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
      supabase.from("pantry_items").insert(item);
    },
    [findPantryItemByName, supabase, togglePantryHave]
  );

  const deletePantryItem = useCallback(
    (id: string) => {
      setPantry((prev) => prev.filter((item) => item.id !== id));
      supabase.from("pantry_items").delete().eq("id", id);
    },
    [supabase]
  );

  const saveRecipe = useCallback(
    (id: string | null, data: RecipeInput) => {
      const recipeId = id ?? `recipe-${crypto.randomUUID().slice(0, 8)}`;
      const recipe: Recipe = { id: recipeId, ...data };

      setRecipes((prev) => (id ? prev.map((r) => (r.id === id ? recipe : r)) : [...prev, recipe]));
      supabase.from("recipes").upsert({ id: recipeId, ...recipeToRow(data) });
    },
    [supabase]
  );

  const deleteRecipe = useCallback(
    (id: string) => {
      setRecipes((prev) => prev.filter((recipe) => recipe.id !== id));
      supabase.from("recipes").delete().eq("id", id);
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
    assignRecipe,
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
