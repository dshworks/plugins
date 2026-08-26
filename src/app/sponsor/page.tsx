import type { Metadata } from "next";
import { getMeta, getSponsors } from "@/lib/data";

export const metadata: Metadata = {
  title: "Sponsor a seat",
  description:
    "Four advertising seats on dsh.works. What a seat buys, what it explicitly cannot buy, what it costs, and how to take one.",
};

// The terms page.
//
// It exists because the seats link somewhere, and "somewhere" had to be a real
// page rather than a mailto or a coming-soon. It is written as the contract it
// is: what you get, what you cannot get at any price, what it costs, who is
// refused. The refusal list is the most useful part of it — a directory that
// will not say who it turns down has not actually decided.
// "2026-08-31" -> "31 August". A deadline a reader can put in a calendar.
function longDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${d} ${months[m - 1]}`;
}

export default async function Sponsor() {
  const [sponsors, meta] = await Promise.all([getSponsors(), getMeta()]);
  if (!sponsors) {
    return (
      <main className="wrap">
        <h1>Seats</h1>
        <p>
          Run <code>npm run data</code>.
        </p>
      </main>
    );
  }

  const open = sponsors.seats.filter((s) => !s.sponsor).length;
  const taken = sponsors.seats.length - open;

  return (
    <main className="wrap">
      <header style={{ paddingTop: "2.5rem" }}>
        <h1>Sponsor a seat</h1>
        <p className="lede">
          There are four. Three are {sponsors.price.said}; the fourth is{" "}
          {sponsors.seats.find((x) => x.price)?.price?.said ?? sponsors.price.said}.{" "}
          {open === 4 ? "All four are" : open === 0 ? "None are" : `${open} of them ${open === 1 ? "is" : "are"}`}{" "}
          open right now. They pay for the domains, the Workers,
          and the sweep that keeps {meta?.counts.plugins.toLocaleString() ?? "6,000+"} rows dated.
        </p>
      </header>

      {sponsors.sale && (
        <p className="lede" style={{ marginTop: "-0.4rem" }}>
          <strong>Intro pricing until {longDate(sponsors.sale.until)}.</strong>{" "}
          {sponsors.sale.was ? `It was ${sponsors.sale.was.said} a seat. ` : ""}
          {sponsors.sale.why} After that the rate goes back up; a seat taken before then keeps
          what it paid for its current term.
        </p>
      )}

      <h2>What a seat buys</h2>
      <div className="panel">
        <div className="row">
          <div className="label">The box</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              One of four gold boxes on the board at the very top of the front page — above the
              headline, above the console, above every chart and every list. It is the first thing
              on the page, framed and labelled ADVERTISEMENT so nobody mistakes it for us. Your
              name, one line of your own copy, and a link. Served from the same static build as
              everything else: no third-party ad script, no tracker, no auction, nothing loaded
              from a network we do not control.
            </p>
          </div>
        </div>
        <div className="row">
          <div className="label">The term</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              Monthly on three seats, cancel whenever; the fourth is annual and cheaper per month
              because it is paid up front. Either way the start and end dates are printed in{" "}
              <a href="https://github.com/dshworks/plugins/blob/main/data/sponsors.json">
                <code>data/sponsors.json</code>
              </a>
              , in the public repo, so the term is a matter of record and an expired seat is
              visibly expired rather than quietly renewed.
            </p>
          </div>
        </div>
        <div className="row">
          <div className="label">Both sites</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              The seat appears on dsh.works and on{" "}
              <a href="https://dshthemes.com">dshthemes.com</a>, which are the same audience
              arriving through two doors. One seat, one price, both bands.
            </p>
          </div>
        </div>
      </div>

      <h2>What no amount of money buys</h2>
      <p className="fine">
        This list is the reason the seat is worth anything. A directory that will sell its rows
        has nothing left to sell.
      </p>
      <ul className="rows">
        <Never what="A listing." how="Entries come from a sweep of the dsh-plugin topic and a published triage. Tag your repo and you are found; buy a seat and you are not." />
        <Never what="A rank, or a place on a shelf." how="Every list on the site is ordered by last push, stars breaking ties. There is no editorial ordering to sell." />
        <Never what="A receipt, or a verified status." how="`evidence` is a file path someone read. It cannot be granted, and a sponsor asking for one would be asking us to publish a lie with a link on it." />
        <Never what="A tag, a category, or a description." how="Those are derived from the registry by a script in a public repo. The script does not read this file — that is enforced in code, not in policy." />
        <Never what="Removal of a competitor." how="Rejections are published with reasons in rejected.json. Removing a working plugin because someone paid would show up as a rejection we could not write a reason for." />
        <Never what="Anything on the specimen slot." how="The plugin decided on the front page is picked by a printed rule — freshest entry carrying a full receipt. It rotates on its own and is not for sale, which is why the four seats exist." />
      </ul>

      <h2>Who we turn down</h2>
      <p className="fine">
        Anything that would make a reader trust the page less: unlabelled crypto and trading
        products, AI-detector and plagiarism-evasion services, credential resellers, anything
        impersonating DeepSeek or implying this site is official, and any advertiser who asks for
        something on the list above. The seats are advertising and are marked{" "}
        <code>rel=&quot;sponsored&quot;</code>; they are not an endorsement, and we will not write
        copy that reads like one.
      </p>

      <h2>Taking one</h2>
      {sponsors.checkout ? (
        <p>
          <a href={sponsors.checkout}>Take a seat — {sponsors.price.said}</a>. Monthly, cancel any
          time before renewal; the annual seat is{" "}
          {sponsors.seats.find((x) => x.price)?.price?.said ?? "priced separately"}. After checkout, send the name, one line of copy, and the link you
          want to <a href={`mailto:${sponsors.contact}`}>{sponsors.contact}</a>; it goes live in
          the next build.
        </p>
      ) : (
        <p>
          Checkout is not wired up yet, so this is done by hand and honestly:{" "}
          <a href={`mailto:${sponsors.contact}`}>{sponsors.contact}</a> with the name, one line of
          copy, and the link. We invoice for the term, and the seat goes live in the next build
          with its dates written into the public repo.
        </p>
      )}
      <p className="fine">
        {taken > 0 && `${taken} of the four ${taken === 1 ? "is" : "are"} currently held. `}
        Traffic and referrer numbers are whatever Cloudflare reports; we will send you the actual
        figures before you buy rather than a media kit. This is a niche site for people who run
        agents, and it is better to say that than to have you find out in month three.
      </p>

      <p className="fine" style={{ marginTop: "2rem" }}>
        <a href="/">← back to the console</a>
      </p>
    </main>
  );
}

function Never({ what, how }: { what: string; how: string }) {
  return (
    <li>
      <span className="line">
        <strong>{what}</strong>
      </span>
      <p className="desc">{how}</p>
    </li>
  );
}
