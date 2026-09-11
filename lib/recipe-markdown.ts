/**
 * Converts a recipe to and from a fixed Markdown layout, so a recipe can be
 * viewed and edited as a plain-text document. The format is ours (not
 * general Markdown), which keeps `parseRecipeMarkdown` a straightforward,
 * bounded reversal of `recipeToMarkdown` rather than a general-purpose
 * Markdown parser — editing free-form prose still works as long as the
 * structural markers (#, ##, **Label:**, "- ", "1.") stay intact.
 */

import type { Ingredient, Recipe, RecipeInput } from "@/lib/types";

const SECTION_HEADINGS = {
  ingredients: "Ingredients",
  prepAhead: "Prep ahead",
  instructions: "Instructions",
} as const;

export function recipeToMarkdown(recipe: Recipe | RecipeInput): string {
  const name = "name" in recipe ? recipe.name : "";
  const lines = [
    `# ${name}`,
    "",
    `**Tags:** ${recipe.tags.join(", ")}`,
    `**Cook time:** ${recipe.cookTimeMin} min`,
    `**Servings:** ${recipe.servings}`,
    "",
    `## ${SECTION_HEADINGS.ingredients}`,
    "",
    ...(recipe.ingredients.length
      ? recipe.ingredients.map((i) => `- ${i.name}${i.qty ? ` — ${i.qty}` : ""}`)
      : ["- "]),
    "",
    `## ${SECTION_HEADINGS.prepAhead}`,
    "",
    ...(recipe.prepSteps.length ? recipe.prepSteps.map((step, i) => `${i + 1}. ${step}`) : ["1. "]),
    "",
    `## ${SECTION_HEADINGS.instructions}`,
    "",
    recipe.instructions,
  ];
  return lines.join("\n");
}

/** Blank starting point for a brand-new recipe. */
export function blankRecipeMarkdown(): string {
  return recipeToMarkdown({
    name: "",
    cookTimeMin: 0,
    servings: 4,
    tags: [],
    ingredients: [],
    prepSteps: [],
    instructions: "",
  });
}

const META_LINE = /^\*\*(.+?):\*\*\s*(.*)$/;
const HEADING_LINE = /^##\s+(.*)$/;
const BULLET_LINE = /^[-*]\s+(.*)$/;
const NUMBERED_LINE = /^\d+[.)]\s+(.*)$/;

function parseIngredientLine(line: string): Ingredient | null {
  const match = BULLET_LINE.exec(line.trim());
  if (!match) return null;
  const [name, qty = ""] = match[1].split("—").map((part) => part.trim());
  return name ? { name, qty } : null;
}

/**
 * Parse a document previously produced by `recipeToMarkdown` (or hand-edited
 * from one) back into recipe fields. Returns null when the document has no
 * name — the one thing a recipe can't be saved without.
 */
export function parseRecipeMarkdown(markdown: string): RecipeInput | null {
  const lines = markdown.split("\n");

  const nameLine = lines.find((line) => /^#\s+/.test(line));
  const name = nameLine?.replace(/^#\s+/, "").trim() ?? "";
  if (!name) return null;

  let tags: string[] = [];
  let cookTimeMin = 0;
  let servings = 1;

  for (const line of lines) {
    const meta = META_LINE.exec(line.trim());
    if (!meta) continue;
    const [, label, value] = meta;
    if (/^tags$/i.test(label)) {
      tags = value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    } else if (/^cook time$/i.test(label)) {
      cookTimeMin = parseInt(value, 10) || 0;
    } else if (/^servings$/i.test(label)) {
      servings = parseInt(value, 10) || 1;
    }
  }

  // Split the body into sections by "## Heading" lines.
  const sections = new Map<string, string[]>();
  let current: string[] | null = null;
  for (const line of lines) {
    const heading = HEADING_LINE.exec(line);
    if (heading) {
      current = [];
      sections.set(heading[1].trim().toLowerCase(), current);
    } else if (current) {
      current.push(line);
    }
  }

  const ingredientLines = sections.get(SECTION_HEADINGS.ingredients.toLowerCase()) ?? [];
  const ingredients = ingredientLines
    .map(parseIngredientLine)
    .filter((i): i is Ingredient => i !== null);

  const prepLines = sections.get(SECTION_HEADINGS.prepAhead.toLowerCase()) ?? [];
  const prepSteps = prepLines
    .map((line) => {
      const numbered = NUMBERED_LINE.exec(line.trim());
      if (numbered) return numbered[1].trim();
      const bulleted = BULLET_LINE.exec(line.trim());
      return bulleted ? bulleted[1].trim() : "";
    })
    .filter(Boolean);

  const instructionLines = sections.get(SECTION_HEADINGS.instructions.toLowerCase()) ?? [];
  const instructions = instructionLines.join("\n").trim();

  return { name, cookTimeMin, servings, tags, ingredients, prepSteps, instructions };
}
