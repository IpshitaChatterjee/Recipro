/**
 * Recipe ingredient names are written for cooking ("Dried chickpeas", "Whole
 * spices (bay leaf, cloves, cardamom)") — precise about prep state, which is
 * exactly what a pantry/shopping list doesn't need. This strips that down to
 * the plain grocery item, so the pantry shows "Chickpeas" instead. Only used
 * for the derived pantry/shopping-list layer — a recipe's own ingredient
 * list keeps the text as written.
 */

/** Leading prep-state descriptors that don't change what to buy. */
const DESCRIPTOR_PREFIXES = ["dried", "fresh", "ground", "chopped", "minced", "sliced", "grated", "canned", "frozen"];

const PREFIX_PATTERN = new RegExp(`^(?:${DESCRIPTOR_PREFIXES.join("|")})\\s+`, "i");
const PARENTHETICAL_PATTERN = /\s*\([^)]*\)/g;

export function normalizeIngredientName(rawName: string): string {
  let name = rawName.trim().replace(PARENTHETICAL_PATTERN, "").trim();
  name = name.replace(PREFIX_PATTERN, "").trim();
  if (!name) return rawName.trim(); // stripping everything would be worse than not normalizing
  return name.charAt(0).toUpperCase() + name.slice(1);
}
