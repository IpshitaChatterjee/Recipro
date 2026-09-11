/**
 * Week maths. A "week id" is the ISO-ish date of that week's Monday
 * (e.g. "2026-09-07") and doubles as the Firestore document id.
 */

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** How many weeks either side of the current one the picker offers. */
const WEEK_PICKER_RANGE = 8;

const pad2 = (n) => String(n).padStart(2, '0');

/** Midnight on the Monday of the week containing `date`. */
export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = d.getDay();
  d.setDate(d.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return d;
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekIdOf(monday) {
  return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
}

const fmtShort = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

export function weekRangeLabel(monday) {
  return `${fmtShort(monday)}–${fmtShort(addDays(monday, 6))}`;
}

export const THIS_MONDAY = mondayOf(new Date());
export const THIS_WEEK_ID = weekIdOf(THIS_MONDAY);

/** Options for the week <select>, oldest first. */
export function buildWeekOptions() {
  const options = [];
  for (let offset = -WEEK_PICKER_RANGE; offset <= WEEK_PICKER_RANGE; offset++) {
    const monday = addDays(THIS_MONDAY, offset * 7);
    const prefix =
      offset === 0 ? 'This week · ' :
      offset === 1 ? 'Next week · ' :
      offset === -1 ? 'Last week · ' : '';
    options.push({ id: weekIdOf(monday), label: prefix + weekRangeLabel(monday) });
  }
  return options;
}
