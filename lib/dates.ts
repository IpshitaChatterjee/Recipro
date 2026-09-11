/**
 * Week maths. A "week id" is the ISO-ish date of that week's Monday
 * (e.g. "2026-09-07") and doubles as the mealplans table's primary key.
 */

/** How many weeks after the current one the picker offers. */
const WEEKS_AHEAD = 3;

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Midnight on the Monday of the week containing `date`. */
export function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = d.getDay();
  d.setDate(d.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function weekIdOf(monday: Date): string {
  return `${monday.getFullYear()}-${pad2(monday.getMonth() + 1)}-${pad2(monday.getDate())}`;
}

const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function weekRangeLabel(monday: Date): string {
  return `${fmtShort(monday)}–${fmtShort(addDays(monday, 6))}`;
}

export const THIS_MONDAY = mondayOf(new Date());
export const THIS_WEEK_ID = weekIdOf(THIS_MONDAY);

export interface WeekOption {
  id: string;
  label: string;
}

/** Options for the week picker: this week plus the next few — no past weeks. */
export function buildWeekOptions(): WeekOption[] {
  const options: WeekOption[] = [];
  for (let offset = 0; offset <= WEEKS_AHEAD; offset++) {
    const monday = addDays(THIS_MONDAY, offset * 7);
    const prefix = offset === 0 ? "This week · " : offset === 1 ? "Next week · " : "";
    options.push({ id: weekIdOf(monday), label: prefix + weekRangeLabel(monday) });
  }
  return options;
}
