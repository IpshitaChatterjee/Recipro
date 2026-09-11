/** The week <select> in the header. */

import { el } from '../lib/dom.js';
import { buildWeekOptions } from '../lib/dates.js';
import { getWeekId, selectWeek } from '../data/store.js';

const weekSelect = document.getElementById('weekSelect');

export function initWeekPicker() {
  for (const option of buildWeekOptions()) {
    weekSelect.appendChild(el('option', { value: option.id }, option.label));
  }
  weekSelect.value = getWeekId();
  weekSelect.addEventListener('change', () => selectWeek(weekSelect.value));
}

/** Keep the control in sync when the week changes from elsewhere. */
export function renderWeekPicker() {
  weekSelect.value = getWeekId();
}
