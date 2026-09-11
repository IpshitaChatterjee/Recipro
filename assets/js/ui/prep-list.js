/** Prep-ahead steps for every meal planned this week. */

import { el, clear, pcheckbox } from '../lib/dom.js';
import { DAYS } from '../lib/dates.js';
import { getDays, findRecipe, togglePrepStep } from '../data/store.js';

const area = document.getElementById('prepArea');

function recipeBlock(day, assignment, recipe) {
  const block = el('div', { class: 'prep-recipe' });
  block.appendChild(el('div', { class: 'prep-head' }, [
    el('span', { class: 'rname' }, recipe.name),
    el('span', { class: 'day-tag' }, `— ${day}`),
  ]));

  recipe.prepSteps.forEach((step, index) => {
    const done = Boolean(assignment.prepDone?.[index]);
    block.appendChild(el('div', { class: 'prep-step' }, [
      pcheckbox(done, () => togglePrepStep(day, index), step, null, true),
    ]));
  });

  return block;
}

export function renderPrepList() {
  clear(area);
  const days = getDays();
  let any = false;

  for (const day of DAYS) {
    const assignment = days[day];
    if (!assignment) continue;
    const recipe = findRecipe(assignment.recipeId);
    if (!recipe || recipe.prepSteps.length === 0) continue;

    any = true;
    area.appendChild(recipeBlock(day, assignment, recipe));
  }

  if (!any) {
    area.appendChild(el('div', { class: 'prep-empty' }, 'Plan a meal above to see its prep-ahead steps here.'));
  }
}
