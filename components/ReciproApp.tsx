"use client";

import { useState } from "react";
import { Header } from "@/components/Header";
import { Tabs, type TabKey } from "@/components/Tabs";
import { WeekView } from "@/components/WeekView";
import { ShoppingList } from "@/components/ShoppingList";
import { PrepList } from "@/components/PrepList";
import { RecipesView } from "@/components/RecipesView";
import { PantryView } from "@/components/PantryView";
import { RecipeDialog } from "@/components/RecipeDialog";
import { Card } from "@/components/ui/card";
import { ReciproProvider, useRecipro } from "@/lib/recipro-context";
import type { Recipe } from "@/lib/types";

function AppShell() {
  const { loading, error } = useRecipro();
  const [tab, setTab] = useState<TabKey>("week");
  // undefined = closed, null = new recipe, Recipe = editing that recipe.
  const [dialogRecipe, setDialogRecipe] = useState<Recipe | null | undefined>(undefined);

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="px-6 text-sm text-muted-foreground">
          Couldn&rsquo;t connect to the database: {error}. Check that <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
          and <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> are set — see the README.
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-muted-foreground">Loading&hellip;</div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
      <Header />
      <div className="mb-6">
        <Tabs active={tab} onChange={setTab} />
      </div>

      <section hidden={tab !== "week"} className="flex flex-col gap-8">
        <div>
          <h2 className="mb-3 font-heading text-base font-medium text-foreground">This week&rsquo;s meals</h2>
          <WeekView />
        </div>
        <ShoppingList />
        <PrepList />
      </section>

      <section hidden={tab !== "recipes"}>
        <RecipesView onNewRecipe={() => setDialogRecipe(null)} onEditRecipe={setDialogRecipe} />
      </section>

      <section hidden={tab !== "pantry"}>
        <PantryView />
      </section>

      <RecipeDialog recipe={dialogRecipe} open={dialogRecipe !== undefined} onClose={() => setDialogRecipe(undefined)} />
    </div>
  );
}

export function ReciproApp() {
  return (
    <ReciproProvider>
      <AppShell />
    </ReciproProvider>
  );
}
