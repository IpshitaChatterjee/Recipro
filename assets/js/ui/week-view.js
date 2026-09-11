/** The seven day cards on the "This week" panel. */

import { el, clear, svgIcon, ICONS } from '../lib/dom.js';
import { DAYS } from '../lib/dates.js';
import { getDays, getRecipes, findRecipe, assignRecipe } from '../data/store.js';

const grid = document.getElementById('dayGrid');

function plannedCard(day, assignment, recipe) {
  const card = el('div', { class: 'day-card' });
  card.appendChild(el('div', { class: 'day-name' }, day));
  card.appendChild(el('div', { class: 'recipe-name' }, recipe.name));

  const prepDone = assignment.prepDone || [];
  const noPrep = recipe.prepSteps.length === 0;
  const allDone = noPrep || prepDone.filter(Boolean).length === recipe.prepSteps.length;

  card.appendChild(el('div', { class: 'meta-row' }, [
    el('span', { class: 'badge' }, `${recipe.cookTimeMin} min IP`),
    el('span', { class: `badge ${allDone ? 'prep-ok' : 'prep-pending'}` },
      noPrep ? 'No prep' : allDone ? 'Prep done' : 'Prep needed'),
  ]));

  card.appendChild(el('div', { class: 'clear-row' }, [
    el('button', {
      class: 'btn text small',
      type: 'button',
      onclick: () => assignRecipe(day, null),
    }, 'Clear'),
  ]));

  return card;
}

function emptyCard(day) {
  const card = el('div', { class: 'day-card is-empty' });
  card.appendChild(el('div', { class: 'day-name' }, day));
  card.appendChild(el('div', { class: 'empty-day' }, 'No meal planned'));

  const select = el('select', {
    'aria-label': `Plan a meal for ${day}`,
    onchange: (event) => {
      if (event.target.value) assignRecipe(day, event.target.value);
    },
  });
  select.appendChild(el('option', { value: '' }, 'Add a meal…'));
  for (const recipe of getRecipes()) {
    select.appendChild(el('option', { value: recipe.id }, recipe.name));
  }

  const wrap = el('span', { class: 'pselect' }, [select, svgIcon(ICONS.chevron, 16)]);
  card.appendChild(wrap);
  return card;
}

export function renderWeek() {
  clear(grid);
  const days = getDays();

  for (const day of DAYS) {
    const assignment = days[day];
    const recipe = assignment ? findRecipe(assignment.recipeId) : null;
    grid.appendChild(recipe ? plannedCard(day, assignment, recipe) : emptyCard(day));
  }
}
