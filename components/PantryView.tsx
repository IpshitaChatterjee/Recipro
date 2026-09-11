"use client";

/** The pantry panel: ingredient and household stock lists, plus their add forms. */

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRecipro } from "@/lib/recipro-context";
import type { PantryCategory, PantryItem } from "@/lib/types";

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
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${item.name}`}
        onClick={() => deletePantryItem(item.id)}
      >
        <X />
      </Button>
    </div>
  );
}

function AddForm({
  category,
  placeholder,
  buttonLabel,
  ariaLabel,
}: {
  category: PantryCategory;
  placeholder: string;
  buttonLabel: string;
  ariaLabel: string;
}) {
  const { addPantryItem } = useRecipro();
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    addPantryItem(category, value, true);
    setValue("");
  }

  return (
    <form className="mt-3 flex gap-2" onSubmit={handleSubmit}>
      <Input placeholder={placeholder} aria-label={ariaLabel} value={value} onChange={(e) => setValue(e.target.value)} />
      <Button type="submit" variant="outline" className="shrink-0">
        {buttonLabel}
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
        <h2 className="mb-3 font-heading text-base font-medium text-foreground">Ingredients</h2>
        <div>
          {ingredients.map((item) => (
            <PantryRow key={item.id} item={item} />
          ))}
        </div>
        <AddForm
          category="ingredient"
          placeholder="Add an ingredient…"
          buttonLabel="Add ingredient"
          ariaLabel="New ingredient name"
        />
      </section>

      <section>
        <h2 className="mb-3 font-heading text-base font-medium text-foreground">Household &amp; misc</h2>
        <div>
          {household.map((item) => (
            <PantryRow key={item.id} item={item} />
          ))}
        </div>
        <AddForm
          category="misc"
          placeholder="Add a household item…"
          buttonLabel="Add item"
          ariaLabel="New household item name"
        />
      </section>
    </div>
  );
}
