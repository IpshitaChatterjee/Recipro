/** The pantry panel: ingredient and household stock lists, plus their add forms. */

import { el, clear, svgIcon, ICONS } from '../lib/dom.js';
import { getPantry, togglePantryHave, deletePantryItem, addPantryItem } from '../data/store.js';

const ingredientList = document.getElementById('ingredientList');
const miscList = document.getElementById('miscList');

const byName = (a, b) => a.name.localeCompare(b.name);

function pantryRow(item) {
  const remove = el('button', {
    class: 'icon-btn',
    type: 'button',
    'aria-label': `Remove ${item.name}`,
    onclick: () => deletePantryItem(item.id),
  }, svgIcon(ICONS.x, 15));

  return el('div', { class: 'pantry-row' }, [
    el('div', { class: 'name' }, item.name),
    el('button', {
      class: `stock-toggle ${item.have ? 'have' : 'out'}`,
      type: 'button',
      onclick: () => togglePantryHave(item.id),
    }, item.have ? 'In stock' : 'Out'),
    remove,
  ]);
}

function fillList(container, category) {
  clear(container);
  getPantry()
    .filter((item) => item.category === category)
    .sort(byName)
    .forEach((item) => container.appendChild(pantryRow(item)));
}

export function renderPantry() {
  fillList(ingredientList, 'ingredient');
  fillList(miscList, 'misc');
}

/** Wire an add form so it appends to `category` and clears itself. */
function initAddForm(formId, inputId, category) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    addPantryItem(category, input.value, true);
    input.value = '';
  });
}

export function initPantryForms() {
  initAddForm('addIngredientForm', 'newIngredientInput', 'ingredient');
  initAddForm('addMiscForm', 'newMiscInput', 'misc');
}
