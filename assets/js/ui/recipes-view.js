/** The recipe cards grid. Clicking a card opens it for editing. */

import { el, clear } from '../lib/dom.js';
import { getRecipes } from '../data/store.js';
import { openRecipeForm } from './recipe-dialog.js';

const grid = document.getElementById('recipeGrid');

function recipeCard(recipe) {
  const open = () => openRecipeForm(recipe);

  const card = el('div', {
    class: 'recipe-card',
    tabindex: '0',
    role: 'button',
    'aria-label': `Edit ${recipe.name}`,
    onclick: open,
    onkeydown: (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      open();
    },
  });

  card.appendChild(el('h3', {}, recipe.name));

  const tags = el('div', { class: 'tags' });
  for (const tag of recipe.tags || []) tags.appendChild(el('span', { class: 'badge' }, tag));
  card.appendChild(tags);

  const stepCount = recipe.prepSteps.length;
  card.appendChild(el('div', { class: 'stat-row' }, [
    el('span', {}, `${recipe.cookTimeMin} min`),
    el('span', {}, `${recipe.ingredients.length} ingredients`),
    el('span', {}, `${stepCount} prep step${stepCount === 1 ? '' : 's'}`),
  ]));

  return card;
}

export function renderRecipes() {
  clear(grid);
  const recipes = getRecipes();

  if (recipes.length === 0) {
    grid.appendChild(el('div', { class: 'empty-state' }, [
      el('p', {}, 'No recipes yet. Add your first Instant Pot recipe to start planning the week.'),
      el('button', {
        class: 'btn primary small',
        type: 'button',
        onclick: () => openRecipeForm(null),
      }, 'New recipe'),
    ]));
    return;
  }

  for (const recipe of recipes) grid.appendChild(recipeCard(recipe));
}
