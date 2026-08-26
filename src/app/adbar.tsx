import { getSponsors } from "@/lib/data";

// One line of advertising across the top of the site.
//
// Not the board. The board is the product — four seats, a disclosure, a
// specimen that demonstrates the purchase — and it stays where it was, under
// the console. This is the strip above it: the offer, the deadline, and a way
// in, on a single row a reader takes in without stopping.
//
// It is a server component and it renders nothing when there is no live offer,
// so the row does not exist rather than sitting there empty. Same rule as the
// board's sale line: an offer whose date has passed comes off the page by
// itself.
export default async function AdBar() {
  const s = await getSponsors();
  if (!s?.sale) return null;

  // Live only until the end of the stated day.
  const ends = Date.parse(s.sale.until) + 86400000;
  if (Date.now() > ends) return null;

  const open = s.seats.filter((x) => !x.sponsor).length;
  if (open === 0) return null;

  const days = Math.max(0, Math.round((Date.parse(s.sale.until) - Date.parse(new Date().toISOString().slice(0, 10))) / 86400000));
  const annual = s.seats.find((x) => x.price)?.price;
  const [, m, d] = s.sale.until.split("-").map(Number);
  const when = `${d} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1]}`;

  return (
    <aside className="adbar">
      <a className="adbar-in" href={s.checkout ?? s.terms}>
        {/* The word comes first and is never abbreviated. A one-line strip is
            exactly where an ad is most likely to be mistaken for site chrome,
            so the label leads rather than trails. */}
        <b className="adbar-tag">Ad</b>
        <span className="adbar-say">
          Sponsor a seat — <b>{s.price.said}</b>
          {annual && <> · annual {annual.said}</>} · {open} of {s.seats.length} open
        </span>
        <span className="adbar-when">
          intro ends {when}
          <span className="adbar-days"> · {days === 0 ? "last day" : `${days}d`}</span>
        </span>
        <span className="adbar-go" aria-hidden="true">→</span>
      </a>
    </aside>
  );
}
