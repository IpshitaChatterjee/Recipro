/** The add/edit recipe <dialog>, including its dynamic ingredient and prep rows. */

import { el, clear, svgIcon, ICONS } from '../lib/dom.js';
import { saveRecipe, deleteRecipe } from '../data/store.js';

const dialog = document.getElementById('recipeDialog');
const form = document.getElementById('recipeForm');
const dialogTitle = document.getElementById('recipeDialogTitle');
const deleteBtn = document.getElementById('deleteRecipeBtn');
const ingredientRows = document.getElementById('ingredientRows');
const prepRows = document.getElementById('prepRows');

const fields = {
  name: document.getElementById('rName'),
  time: document.getElementById('rTime'),
  servings: document.getElementById('rServings'),
  tags: document.getElementById('rTags'),
  instructions: document.getElementById('rInstructions'),
};

/** Id of the recipe being edited, or null when creating a new one. */
let editingId = null;

function removeRowButton(row, label) {
  return el('button', {
    class: 'icon-btn',
    type: 'button',
    'aria-label': label,
    onclick: () => row.remove(),
  }, svgIcon(ICONS.x, 14));
}

function addIngredientRow(name = '', qty = '') {
  const row = el('div', { class: 'dyn-row' });
  row.append(
    el('input', { type: 'text', class: 'ing-name', placeholder: 'Ingredient', value: name, 'aria-label': 'Ingredient' }),
    el('input', { type: 'text', class: 'ing-qty', placeholder: 'Qty', value: qty, 'aria-label': 'Quantity' }),
    removeRowButton(row, 'Remove ingredient')
  );
  ingredientRows.appendChild(row);
}

function addPrepRow(text = '') {
  const row = el('div', { class: 'dyn-row' });
  row.append(
    el('input', { type: 'text', class: 'prep-text', placeholder: 'Prep step', value: text, 'aria-label': 'Prep step' }),
    removeRowButton(row, 'Remove step')
  );
  prepRows.appendChild(row);
}

/**
 * Open the dialog.
 * @param {object|null} recipe The recipe to edit, or null for a new one.
 */
export function openRecipeForm(recipe) {
  editingId = recipe ? recipe.id : null;

  dialogTitle.textContent = recipe ? 'Edit recipe' : 'New recipe';
  deleteBtn.style.display = recipe ? 'inline-flex' : 'none';
  fields.name.value = recipe ? recipe.name : '';
  fields.time.value = recipe ? recipe.cookTimeMin : '';
  fields.servings.value = recipe ? recipe.servings : '';
  fields.tags.value = recipe ? (recipe.tags || []).join(', ') : '';
  fields.instructions.value = recipe ? recipe.instructions : '';

  clear(ingredientRows);
  clear(prepRows);

  // Always show at least one blank row so the form is usable straight away.
  if (recipe?.ingredients.length) recipe.ingredients.forEach((i) => addIngredientRow(i.name, i.qty));
  else addIngredientRow();

  if (recipe?.prepSteps.length) recipe.prepSteps.forEach((step) => addPrepRow(step));
  else addPrepRow();

  dialog.showModal();
}

/** Read the dynamic rows and static fields back into a recipe object. */
function readForm() {
  const ingredients = [...ingredientRows.querySelectorAll('.dyn-row')]
    .map((row) => ({
      name: row.querySelector('.ing-name').value.trim(),
      qty: row.querySelector('.ing-qty').value.trim(),
    }))
    .filter((ingredient) => ingredient.name);

  const prepSteps = [...prepRows.querySelectorAll('.dyn-row')]
    .map((row) => row.querySelector('.prep-text').value.trim())
    .filter(Boolean);

  const tags = fields.tags.value.split(',').map((tag) => tag.trim()).filter(Boolean);

  return {
    name: fields.name.value.trim(),
    cookTimeMin: parseInt(fields.time.value, 10) || 0,
    servings: parseInt(fields.servings.value, 10) || 1,
    tags,
    ingredients,
    prepSteps,
    instructions: fields.instructions.value.trim(),
  };
}

export function initRecipeDialog() {
  document.getElementById('newRecipeBtn').addEventListener('click', () => openRecipeForm(null));
  document.getElementById('closeDialogBtn').addEventListener('click', () => dialog.close());
  document.getElementById('cancelRecipeBtn').addEventListener('click', () => dialog.close());
  document.getElementById('addIngRowBtn').addEventListener('click', () => addIngredientRow());
  document.getElementById('addPrepRowBtn').addEventListener('click', () => addPrepRow());

  deleteBtn.addEventListener('click', () => {
    if (!editingId) return;
    if (!confirm("Delete this recipe? This can't be undone.")) return;
    deleteRecipe(editingId);
    dialog.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = readForm();
    if (!data.name) return;
    saveRecipe(editingId, data);
    dialog.close();
  });
}
