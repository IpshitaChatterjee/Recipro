"use client";

/** The add/edit recipe dialog, including its dynamic ingredient and prep rows. */

import { useState, type FormEvent } from "react";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRecipro } from "@/lib/recipro-context";
import type { Ingredient, Recipe } from "@/lib/types";

interface Props {
  /** The recipe being edited, or null when creating a new one, or undefined when the dialog is closed. */
  recipe: Recipe | null | undefined;
  open: boolean;
  onClose: () => void;
}

let rowKeySeq = 0;
const nextRowKey = () => rowKeySeq++;

/**
 * The form body. Keyed by the outer component on the recipe's id (see
 * RecipeDialog below) so opening a different recipe mounts a fresh instance
 * with its own initial state, rather than an effect reaching in to reset it.
 */
function RecipeForm({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  const { saveRecipe, deleteRecipe } = useRecipro();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [name, setName] = useState(recipe?.name ?? "");
  const [time, setTime] = useState(recipe ? String(recipe.cookTimeMin) : "");
  const [servings, setServings] = useState(recipe ? String(recipe.servings) : "");
  const [tags, setTags] = useState(recipe ? (recipe.tags || []).join(", ") : "");
  const [instructions, setInstructions] = useState(recipe?.instructions ?? "");
  const [ingredientRows, setIngredientRows] = useState(() =>
    recipe?.ingredients.length
      ? recipe.ingredients.map((i) => ({ key: nextRowKey(), name: i.name, qty: i.qty }))
      : [{ key: nextRowKey(), name: "", qty: "" }]
  );
  const [prepRows, setPrepRows] = useState(() =>
    recipe?.prepSteps.length
      ? recipe.prepSteps.map((step) => ({ key: nextRowKey(), text: step }))
      : [{ key: nextRowKey(), text: "" }]
  );

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const ingredients: Ingredient[] = ingredientRows
      .map((row) => ({ name: row.name.trim(), qty: row.qty.trim() }))
      .filter((ingredient) => ingredient.name);

    const prepSteps = prepRows.map((row) => row.text.trim()).filter(Boolean);
    const parsedTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    saveRecipe(recipe?.id ?? null, {
      name: trimmedName,
      cookTimeMin: parseInt(time, 10) || 0,
      servings: parseInt(servings, 10) || 1,
      tags: parsedTags,
      ingredients,
      prepSteps,
      instructions: instructions.trim(),
    });
    onClose();
  }

  function handleDelete() {
    if (!recipe) return;
    deleteRecipe(recipe.id);
    onClose();
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{recipe ? "Edit recipe" : "New recipe"}</SheetTitle>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto px-6 pb-6">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rName">Name</Label>
          <Input id="rName" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rTime">Instant Pot time (min)</Label>
            <Input type="number" id="rTime" min={1} required value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rServings">Servings</Label>
            <Input
              type="number"
              id="rServings"
              min={1}
              required
              value={servings}
              onChange={(e) => setServings(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rTags">Tags (comma separated)</Label>
          <Input id="rTags" placeholder="dal, vegan, weeknight" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Ingredients</Label>
          <div className="flex flex-col gap-2">
            {ingredientRows.map((row) => (
              <div className="flex gap-2" key={row.key}>
                <Input
                  placeholder="Ingredient"
                  aria-label="Ingredient"
                  value={row.name}
                  onChange={(e) =>
                    setIngredientRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, name: e.target.value } : r)))
                  }
                />
                <Input
                  placeholder="Qty"
                  aria-label="Quantity"
                  className="w-28 shrink-0"
                  value={row.qty}
                  onChange={(e) =>
                    setIngredientRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, qty: e.target.value } : r)))
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  aria-label="Remove ingredient"
                  onClick={() => setIngredientRows((rows) => rows.filter((r) => r.key !== row.key))}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setIngredientRows((rows) => [...rows, { key: nextRowKey(), name: "", qty: "" }])}
          >
            + Add ingredient
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Prep ahead steps</Label>
          <div className="flex flex-col gap-2">
            {prepRows.map((row) => (
              <div className="flex gap-2" key={row.key}>
                <Input
                  placeholder="Prep step"
                  aria-label="Prep step"
                  value={row.text}
                  onChange={(e) =>
                    setPrepRows((rows) => rows.map((r) => (r.key === row.key ? { ...r, text: e.target.value } : r)))
                  }
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  type="button"
                  aria-label="Remove step"
                  onClick={() => setPrepRows((rows) => rows.filter((r) => r.key !== row.key))}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={() => setPrepRows((rows) => [...rows, { key: nextRowKey(), text: "" }])}
          >
            + Add prep step
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rInstructions">Instructions</Label>
          <Textarea
            id="rInstructions"
            required
            className="min-h-24"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {recipe ? (
            <Button type="button" variant="destructive" onClick={() => setConfirmingDelete(true)}>
              Delete recipe
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save recipe</Button>
          </div>
        </div>
      </form>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this recipe?</AlertDialogTitle>
            <AlertDialogDescription>This can&rsquo;t be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function RecipeDialog({ recipe, open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" className="data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
        {/* Keyed on the recipe so switching recipes mounts a fresh form
            instead of an effect resetting an existing one's state. */}
        {open && <RecipeForm key={recipe?.id ?? "new"} recipe={recipe ?? null} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
