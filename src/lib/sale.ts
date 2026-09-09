// One rule for "is the intro still on", because there are two surfaces and
// they disagreed.
//
// The board (`seats.tsx`) has always dropped a lapsed sale. The terms page
// (`sponsor/page.tsx`) rendered `sponsors.sale &&` with no date in it, so from
// 2026-09-01 dsh.works/sponsor advertised "Intro pricing until 31 August" and
// "after that the rate goes back up" for nine days, at a rate that had not
// gone anywhere. A deadline that has passed is not urgency, it is a false
// claim on a page that asks for money.
//
// Deliberately not in `data.ts`: `seats.tsx` is a client component and
// importing a function from the loader pulls it into the browser bundle.

/** An intro offer with a real deadline printed on the page. */
export type Sale = { until: string; said: string; why?: string; was?: { said: string } };

/**
 * The sale if it is still running, else null.
 *
 * One whole day of grace past `until`, so a deadline written in the file as a
 * date does not expire mid-morning in whichever timezone the reader is in —
 * the date is the last day, not the first instant of it.
 */
export function liveSale<T extends Sale>(sale: T | undefined | null, now = Date.now()): T | null {
  if (!sale) return null;
  const ends = Date.parse(sale.until);
  if (Number.isNaN(ends)) return null;
  return now <= ends + 86_400_000 ? sale : null;
}

/** Days from `now` until an ISO date, floored at 0. */
export function daysUntil(iso: string, now = Date.now()): number {
  const today = new Date(now).toISOString().slice(0, 10);
  return Math.max(0, Math.round((Date.parse(iso) - Date.parse(today)) / 86400000));
}
