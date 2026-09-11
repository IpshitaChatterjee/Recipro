/**
 * The shopping list: every ingredient this week's planned meals need that the
 * pantry does not have, plus any household item marked out of stock.
 */

import { el, clear, pcheckbox } from '../lib/dom.js';
import { DAYS } from '../lib/dates.js';
import {
  getDays, getPantry, findRecipe, findPantryItemByName,
  togglePantryHave, addPantryItem,
} from '../data/store.js';

const area = document.getElementById('shopArea');
const countEl = document.getElementById('shopCount');

/**
 * Walk the week and collect missing ingredients.
 * @returns {{needed: Map<string, string[]>, anyPlanned: boolean}} Ingredient
 *   name to the recipes that want it, in first-seen order.
 */
function collectMissingIngredients() {
  const needed = new Map();
  let anyPlanned = false;
  const days = getDays();

  for (const day of DAYS) {
    const assignment = days[day];
    if (!assignment) continue;
    const recipe = findRecipe(assignment.recipeId);
    if (!recipe) continue;
    anyPlanned = true;

    for (const ingredient of recipe.ingredients) {
      const pantryItem = findPantryItemByName(ingredient.name);
      if (pantryItem?.have) continue;

      if (!needed.has(ingredient.name)) needed.set(ingredient.name, []);
      const wantedBy = needed.get(ingredient.name);
      if (!wantedBy.includes(recipe.name)) wantedBy.push(recipe.name);
    }
  }

  return { needed, anyPlanned };
}

function renderEmptyState(anyPlanned) {
  if (anyPlanned) {
    area.appendChild(el('div', { class: 'all-good' }, 'You have everything you need for this week.'));
    return;
  }
  area.appendChild(el('div', { class: 'empty-state' }, [
    el('p', {}, 'Nothing planned yet. Add meals to the days above and anything missing from your pantry will show up here.'),
  ]));
}

function ingredientGroup(needed) {
  const list = el('div', { class: 'shop-list' });

  for (const [name, wantedBy] of needed) {
    // Ticking an item means "I bought it" — restock it, or add it to the pantry.
    const onChange = () => {
      const pantryItem = findPantryItemByName(name);
      if (pantryItem) togglePantryHave(pantryItem.id);
      else addPantryItem('ingredient', name, true);
    };
    list.appendChild(el('div', { class: 'shop-item' }, [
      pcheckbox(false, onChange, name, `for ${wantedBy.join(', ')}`),
    ]));
  }

  return el('div', { class: 'shop-group' }, [el('h3', {}, 'Ingredients'), list]);
}

function householdGroup(items) {
  const list = el('div', { class: 'shop-list' });
  for (const item of items) {
    list.appendChild(el('div', { class: 'shop-item' }, [
      pcheckbox(false, () => togglePantryHave(item.id), item.name),
    ]));
  }
  return el('div', { class: 'shop-group' }, [el('h3', {}, 'Household'), list]);
}

export function renderShoppingList() {
  clear(area);

  const { needed, anyPlanned } = collectMissingIngredients();
  const household = getPantry().filter((item) => item.category === 'misc' && !item.have);
  const total = needed.size + household.length;

  countEl.textContent = total === 0 ? '' : `${total} item${total === 1 ? '' : 's'}`;

  if (total === 0) {
    renderEmptyState(anyPlanned);
    return;
  }

  const cols = el('div', { class: 'shop-cols' });
  if (needed.size) cols.appendChild(ingredientGroup(needed));
  if (household.length) cols.appendChild(householdGroup(household));
  area.appendChild(cols);
}
