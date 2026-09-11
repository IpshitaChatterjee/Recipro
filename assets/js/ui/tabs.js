/**
 * Tablist behaviour for the three top-level panels, following the WAI-ARIA
 * tabs pattern (arrow keys, Home/End, roving tabindex).
 */

const tabButtons = [...document.querySelectorAll('.tab-btn')];

const panels = {
  week: document.getElementById('panel-week'),
  recipes: document.getElementById('panel-recipes'),
  pantry: document.getElementById('panel-pantry'),
};

function setTab(tab, moveFocus = false) {
  for (const button of tabButtons) {
    const active = button.getAttribute('data-tab') === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.setAttribute('tabindex', active ? '0' : '-1');
    if (active && moveFocus) button.focus();
  }
  for (const [key, panel] of Object.entries(panels)) panel.hidden = key !== tab;
}

/** Index of the tab an arrow/Home/End key should move to, or null. */
function nextIndexFor(key, current) {
  switch (key) {
    case 'ArrowRight': return (current + 1) % tabButtons.length;
    case 'ArrowLeft': return (current - 1 + tabButtons.length) % tabButtons.length;
    case 'Home': return 0;
    case 'End': return tabButtons.length - 1;
    default: return null;
  }
}

export function initTabs() {
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => setTab(button.getAttribute('data-tab')));
    button.addEventListener('keydown', (event) => {
      const next = nextIndexFor(event.key, index);
      if (next === null) return;
      event.preventDefault();
      setTab(tabButtons[next].getAttribute('data-tab'), true);
    });
  });
}
