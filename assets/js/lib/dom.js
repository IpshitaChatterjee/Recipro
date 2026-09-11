/**
 * Small DOM helpers shared by every view.
 */

/**
 * Create an element.
 * @param {string} tag
 * @param {Object<string, *>} [attrs] Attributes; `class` maps to className and
 *   any `onX` key whose value is a function is added as an event listener.
 * @param {(Node|string|number|null)[]|Node|string|number} [children]
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === null) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value);
  }

  const list = Array.isArray(children) ? children : [children];
  for (const child of list) {
    if (child === null || child === undefined) continue;
    node.appendChild(
      typeof child === 'string' || typeof child === 'number'
        ? document.createTextNode(String(child))
        : child
    );
  }

  return node;
}

/** Remove every child of `node`. */
export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Generate a collision-unlikely id with a readable prefix. */
export function genId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Shallow copy without the `id` field (ids live in the document key, not the body). */
export function omitId(obj) {
  const { id, ...rest } = obj;
  return rest;
}

export const ICONS = {
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
};

/**
 * Wrap raw SVG path markup in a sized, inline-flex span.
 * @param {string} paths Trusted, module-local path markup (never user input).
 */
export function svgIcon(paths, size) {
  const span = el('span', { class: 'i', 'aria-hidden': 'true' });
  span.innerHTML =
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  span.style.display = 'inline-flex';
  return span;
}

/**
 * A styled checkbox row: a real <input type=checkbox> for accessibility with a
 * painted box on top.
 */
export function pcheckbox(checked, onChange, labelText, subText = null, strike = false) {
  const wrap = el('label', { class: 'pcheck' });

  const input = el('input', { type: 'checkbox' });
  input.checked = checked;
  input.addEventListener('change', onChange);
  wrap.appendChild(input);

  const box = el('span', { class: `pcheck-box${checked ? ' checked' : ''}` });
  if (checked) {
    const mark = svgIcon(ICONS.check, 13);
    mark.querySelector('svg').setAttribute('stroke-width', '2.5');
    box.appendChild(mark);
  }
  wrap.appendChild(box);

  const text = el('span', { class: 'pcheck-text' });
  text.appendChild(el('span', { class: `pcheck-label${strike && checked ? ' done' : ''}` }, labelText));
  if (subText) text.appendChild(el('span', { class: 'pcheck-sub' }, subText));
  wrap.appendChild(text);

  return wrap;
}
