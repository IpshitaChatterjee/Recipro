/**
 * Entry point: wires the views to the store, then connects to the database.
 *
 * Views are pure renderers — they read from the store and re-run whenever it
 * announces a change, rather than being told what specifically changed.
 */

import { subscribe, init } from './data/store.js';
import { initTabs } from './ui/tabs.js';
import { initWeekPicker, renderWeekPicker } from './ui/week-picker.js';
import { renderWeek } from './ui/week-view.js';
import { renderShoppingList } from './ui/shopping-list.js';
import { renderPrepList } from './ui/prep-list.js';
import { renderRecipes } from './ui/recipes-view.js';
import { renderPantry, initPantryForms } from './ui/pantry-view.js';
import { initRecipeDialog } from './ui/recipe-dialog.js';

function render() {
  renderWeekPicker();
  renderWeek();
  renderShoppingList();
  renderPrepList();
  renderRecipes();
  renderPantry();
}

initTabs();
initWeekPicker();
initPantryForms();
initRecipeDialog();

subscribe(render);
render();

init();
