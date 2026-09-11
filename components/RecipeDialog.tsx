"use client";

/**
 * The recipe sheet: a read-only Markdown-style detail view with an "Edit
 * recipe" action that switches the same sheet into a raw-Markdown editor.
 * Saving parses that text back into the recipe's structured fields — see
 * lib/recipe-markdown.ts for the format and the parser's rules.
 */

import { useState, type ChangeEvent } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { blankRecipeMarkdown, parseRecipeMarkdown, recipeToMarkdown } from "@/lib/recipe-markdown";
import { useRecipro } from "@/lib/recipro-context";
import type { Recipe } from "@/lib/types";

interface Props {
  /** The recipe being viewed/edited, or null when creating a new one, or undefined when the sheet is closed. */
  recipe: Recipe | null | undefined;
  open: boolean;
  onClose: () => void;
}

/**
 * Instructions are stored as one free-form string, not a step array like
 * ingredients/prep steps — but a recipe is often still typed as "1. ... 2.
 * ...". When every non-blank line follows that pattern, split it into steps
 * so it can get the same numbered-list treatment as Prep ahead; otherwise
 * leave it as flowing prose.
 */
function splitInstructionSteps(text: string): string[] | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) return null;

  const stepPattern = /^\d+[.)]\s+(.*)$/;
  const steps: string[] = [];
  for (const line of lines) {
    const match = stepPattern.exec(line);
    if (!match) return null;
    steps.push(match[1]);
  }
  return steps;
}

function RecipeDetailView({
  recipe,
  onEdit,
  onDeleteRequested,
}: {
  recipe: Recipe;
  onEdit: () => void;
  onDeleteRequested: () => void;
}) {
  const instructionSteps = splitInstructionSteps(recipe.instructions);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{recipe.name}</SheetTitle>
      </SheetHeader>

      <div className="flex flex-col gap-6 overflow-y-auto px-6 pb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline">{recipe.cookTimeMin} min</Badge>
          <Badge variant="outline">
            {recipe.servings} serving{recipe.servings === 1 ? "" : "s"}
          </Badge>
          {recipe.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>

        <div>
          <h3 className="mb-2 font-heading text-sm font-medium text-foreground">Ingredients</h3>
          {recipe.ingredients.length ? (
            <ul className="flex flex-col gap-1.5 text-sm text-foreground">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span>{ing.name}</span>
                  {ing.qty && <span className="text-muted-foreground">{ing.qty}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No ingredients listed.</p>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-heading text-sm font-medium text-foreground">Prep ahead</h3>
          {recipe.prepSteps.length ? (
            <ol className="flex flex-col gap-1.5 text-sm text-foreground">
              {recipe.prepSteps.map((step, i) => (
                <li key={i} className="flex items-baseline gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{step.text}</span>
                  {step.nightBefore && (
                    <Badge variant="secondary" className="shrink-0">
                      Night before
                    </Badge>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">No prep-ahead steps.</p>
          )}
        </div>

        <div>
          <h3 className="mb-2 font-heading text-sm font-medium text-foreground">Instructions</h3>
          {instructionSteps ? (
            <ol className="flex flex-col gap-1.5 text-sm text-foreground">
              {instructionSteps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm whitespace-pre-wrap text-foreground">{recipe.instructions || "—"}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <Button type="button" variant="destructive" onClick={onDeleteRequested}>
            Delete recipe
          </Button>
          <Button type="button" onClick={onEdit}>
            Edit recipe
          </Button>
        </div>
      </div>
    </>
  );
}

function RecipeMarkdownEditor({
  recipe,
  onSaved,
  onCancel,
}: {
  recipe: Recipe | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { saveRecipe } = useRecipro();
  const [markdown, setMarkdown] = useState(() => (recipe ? recipeToMarkdown(recipe) : blankRecipeMarkdown()));
  const [error, setError] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    setMarkdown(event.target.value);
    if (error) setError(null);
  }

  function handleSave() {
    const parsed = parseRecipeMarkdown(markdown);
    if (!parsed) {
      setError('Add a title as a "# Recipe name" heading at the top before saving.');
      return;
    }
    saveRecipe(recipe?.id ?? null, parsed);
    onSaved();
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>{recipe ? "Edit recipe" : "New recipe"}</SheetTitle>
      </SheetHeader>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pb-6">
        <p className="text-xs text-muted-foreground">
          Edit the recipe as Markdown. Keep the <code className="font-mono">#</code>, <code className="font-mono">##</code>,{" "}
          <code className="font-mono">**Label:**</code>, and list markers intact so it can be read back correctly. Add{" "}
          <code className="font-mono">(night before)</code> to the end of a prep step to flag it as something to do
          the night before, e.g. <code className="font-mono">1. Soak rajma (night before)</code>.
        </p>
        <Textarea
          value={markdown}
          onChange={handleChange}
          spellCheck={false}
          className="min-h-[50vh] flex-1 font-mono text-xs"
        />
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save recipe
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * Keyed by the outer component on the recipe's id (see RecipeDialog below)
 * so opening a different recipe mounts a fresh instance with its own
 * initial state, rather than an effect reaching in to reset it.
 */
function RecipeDialogBody({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  const { deleteRecipe } = useRecipro();
  const [mode, setMode] = useState<"view" | "edit">(recipe ? "view" : "edit");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function handleDelete() {
    if (!recipe) return;
    deleteRecipe(recipe.id);
    onClose();
  }

  return (
    <>
      {mode === "edit" || !recipe ? (
        <RecipeMarkdownEditor
          recipe={recipe}
          onSaved={onClose}
          onCancel={() => (recipe ? setMode("view") : onClose())}
        />
      ) : (
        <RecipeDetailView recipe={recipe} onEdit={() => setMode("edit")} onDeleteRequested={() => setConfirmingDelete(true)} />
      )}

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
      <SheetContent side="right" className="flex flex-col data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        {open && <RecipeDialogBody key={recipe?.id ?? "new"} recipe={recipe ?? null} onClose={onClose} />}
      </SheetContent>
    </Sheet>
  );
}
