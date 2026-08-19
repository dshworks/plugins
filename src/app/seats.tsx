import type { Sponsors } from "@/lib/data";

// The four seats.
//
// This is the only thing on dsh.works that money can move, and the design's
// whole job is to make that obvious rather than to hide it. Hence: one colour
// nothing else on the site uses, a band with its own rules top and bottom, the
// word "advertising" said plainly in the first line, and empty seats drawn
// empty. A directory whose only asset is being believed cannot afford an ad
// that has to be discovered.
//
// What a seat does not touch is the point. It cannot put a plugin in the
// registry, move one up a shelf, add a tag, add a receipt, or change a single
// number on any page — and the copy says so at the seat, not in a footer,
// because a disclosure a reader has to go looking for is a disclosure designed
// not to be found.
export default function Seats({ data, site }: { data: Sponsors; site: string }) {
  const open = data.seats.filter((s) => !s.sponsor).length;
  // A seat links to checkout when there is a checkout, and to the terms page
  // when there is not. Never to a "coming soon" — an inert control that looks
  // live is the cheapest way to teach a visitor that this site's affordances
  // are decorative.
  const buy = data.checkout ?? data.terms;

  return (
    <section className="seats" aria-labelledby="seats-h">
      <div className="seats-head">
        <h2 id="seats-h" className="title" style={{ border: "none", margin: 0, padding: 0 }}>
          Four seats · advertising
        </h2>
        <span className="terms">
          {data.price.said} · <a href={data.terms}>what a seat buys</a>
        </span>
      </div>

      <ul className="seats-grid">
        {data.seats.map((s) => (
          <li key={s.n}>
            {s.sponsor ? (
              <a
                className="seat is-taken"
                href={s.sponsor.url}
                // Paid links are marked as paid for the machines too, not only
                // for the reader. Doing this in the markup is what makes the
                // sentence in the copy true.
                rel="sponsored nofollow noopener"
                target="_blank"
              >
                <span className="tag">seat {String(s.n).padStart(2, "0")} · sponsor</span>
                <span className="who">{s.sponsor.name}</span>
                <span className="say">{s.sponsor.line}</span>
              </a>
            ) : (
              <a className="seat" href={buy} aria-label={`Seat ${s.n} is open — ${data.price.said}`}>
                <span className="plus" aria-hidden="true">
                  [<b>+</b>]
                </span>
                <span className="n">seat {String(s.n).padStart(2, "0")}</span>
                <span className="say">open</span>
              </a>
            )}
          </li>
        ))}
      </ul>

      <p className="seats-fine">
        {open === 4 ? (
          <>All four are open, and they are drawn open — nobody has bought one yet. </>
        ) : (
          <>
            {open === 0 ? "All four are taken." : `${open} of the four ${open === 1 ? "is" : "are"} open.`}{" "}
          </>
        )}
        <strong>A seat buys the box and nothing else:</strong> no row in the registry, no place on
        a shelf, no tag, no receipt, no rank, and no say in what gets listed or how it is
        described. The {site} data is built from a public registry by a script anyone can run, and
        no sponsor has ever been able to change a number in it. That is the whole product — if a
        seat could bend it, there would be nothing left worth sponsoring.
      </p>
    </section>
  );
}
