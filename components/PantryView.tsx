"use client";

/**
 * The pantry panel. Ingredients are derived automatically from what recipes
 * use (see the sync effect in lib/recipro-context.tsx) — mark one out of
 * stock here to have it show up on the shopping list, but adding/removing
 * ingredients happens by editing recipes, not here. Household items are
 * unaffected and stay manually managed.
 */

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecipro } from "@/lib/recipro-context";
import type { PantryItem } from "@/lib/types";

function PantryRow({ item }: { item: PantryItem }) {
  const { togglePantryHave, deletePantryItem } = useRecipro();

  return (
    <div className="flex items-center gap-2 border-b border-border py-2 last:border-b-0">
      <div className="flex-1 text-sm text-foreground">{item.name}</div>
      <Button
        variant={item.have ? "secondary" : "outline"}
        size="sm"
        className={item.have ? "" : "text-muted-foreground"}
        onClick={() => togglePantryHave(item.id)}
      >
        {item.have ? "In stock" : "Out"}
      </Button>
      {/* Ingredient rows are derived from recipes — removing one here would
          just have it reappear, so only household items can be deleted. */}
      {item.category === "misc" && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${item.name}`}
          onClick={() => deletePantryItem(item.id)}
        >
          <X />
        </Button>
      )}
    </div>
  );
}

function AddHouseholdItemForm() {
  const { addPantryItem } = useRecipro();
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    addPantryItem("misc", value, true);
    setValue("");
  }

  return (
    <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
      <Input
        placeholder="Add a household item…"
        aria-label="New household item name"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button type="submit" variant="outline" className="shrink-0">
        Add item
      </Button>
    </form>
  );
}

export function PantryView() {
  const { pantry } = useRecipro();
  const byName = (a: PantryItem, b: PantryItem) => a.name.localeCompare(b.name);
  const ingredients = pantry.filter((item) => item.category === "ingredient").sort(byName);
  const household = pantry.filter((item) => item.category === "misc").sort(byName);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 font-heading text-base font-medium text-foreground">Ingredients</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Populated automatically from your recipes — mark anything out of stock to add it to the shopping list.
        </p>
        {ingredients.length ? (
          <div>
            {ingredients.map((item) => (
              <PantryRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No ingredients yet — add a recipe to populate this list.</p>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-heading text-base font-medium text-foreground">Household &amp; misc</h2>
        <div>
          {household.map((item) => (
            <PantryRow key={item.id} item={item} />
          ))}
        </div>
        <AddHouseholdItemForm />
      </section>
    </div>
  );
}
