"use client";

import { useEffect, useRef, useState } from "react";
import type { Sponsors } from "@/lib/data";

// The four seats, as a departure board.
//
// The first version was a gold-tinted row of boxes drawn in the site's own
// material. It disclosed honestly but it was still *drawn into* the document,
// so it read as a section of the site rather than as space let to someone else.
// This one breaks register: a matte board of fixed character cells, laid on the
// page, in a world nothing else here wears. You can tell it is advertising from
// across the room, which is the entire design requirement.
//
// The idle motion demonstrates the purchase instead of rotating what is sold.
// An open seat clatters through and settles on a mark labelled SPECIMEN for
// exactly as long as it is one, then clatters back to [+]. Nobody has to read a
// sentence explaining what buying the space would do; they watch it happen. No
// borrowed logo ever stands in for a sponsor we do not have — that is invented
// proof, and a trademark problem the moment money changes hands.
//
// One rule worth stating because the first version broke it: the status colour
// is spent on STATE — the seat the loop is on, the seat under the pointer, the
// one action — and never repaints a paying sponsor's mark. A sponsor's name is
// set in the board's own white. If gold meant "sponsor", a real sponsor would be
// indistinguishable from an empty seat's call to action, which is backwards.
//
// Every seat is on screen 100% of the time. A carousel would hide the thing
// people paid for, and "your logo, one slot in four, some of the time" is a
// worse product than the one this sells.

const CELLS = 24; // characters per sponsor field. Wide enough that a real product name fits
// whole — a truncated sponsor name is worth nothing to either party — and
// wide enough that the field spans its column the way a departure board's
// destination does, instead of floating in dead space.
const FLAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·-.&+ ";

// What an open seat demonstrates. Deliberately not a fake company: it says what
// the buyer would put there, in the buyer's own terms.
const SPECIMEN = "YOUR PRODUCT";

const pad = (s: string) => s.slice(0, CELLS).padEnd(CELLS, " ");
const EMPTY = pad("[+]");

export default function Seats({ data, site }: { data: Sponsors; site: string }) {
  const seats = data.seats;
  const open = seats.filter((s) => !s.sponsor);
  const buy = data.checkout ?? data.terms;

  // Which open seat is currently demonstrating, and what its cells read.
  const [demo, setDemo] = useState<number | null>(null);
  const [text, setText] = useState<string>(EMPTY);
  const paused = useRef(false);
  const boardRef = useRef<HTMLSelectElement | HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open.length) return;
    // No loop at all under reduced motion. The staging's fallback is that one
    // seat stays filled so the offer still reads without any movement.
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.matches) {
      setDemo(open[0].n);
      setText(pad(SPECIMEN));
      return;
    }

    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    let i = 0;

    // Flip from one string to the next, per character, settling left to right.
    // Only cells whose glyph actually changes clatter; the rest hold, which is
    // what makes it read as a board and not as a text animation.
    const flipTo = (target: string, done: () => void) => {
      const from = pad(text);
      const to = pad(target);
      let step = 0;
      const STEPS = 9;
      const tick = () => {
        if (!alive) return;
        step += 1;
        const out = to
          .split("")
          .map((ch, idx) => {
            const settleAt = Math.floor((idx / CELLS) * (STEPS - 3)) + 3;
            if (step >= settleAt) return ch;
            if (from[idx] === ch) return ch;
            return FLAP[(step * 7 + idx * 13) % FLAP.length];
          })
          .join("");
        setText(out);
        if (step < STEPS) timer = setTimeout(tick, 55);
        else done();
      };
      tick();
    };

    const cycle = () => {
      if (!alive) return;
      if (paused.current) {
        timer = setTimeout(cycle, 1200);
        return;
      }
      const seat = open[i % open.length];
      i += 1;
      setDemo(seat.n);
      flipTo(SPECIMEN, () => {
        timer = setTimeout(() => {
          if (!alive) return;
          // Drop the SPECIMEN tag as the field STARTS emptying, not when it
          // finishes. The staging's rule is that a seat is tagged specimen for
          // exactly as long as it is one, and clearing it at the end left the
          // board reading "SPECIMEN" beside a field showing [+] — a label
          // describing something that is no longer on screen.
          setDemo(null);
          flipTo("[+]", () => {
            timer = setTimeout(cycle, 2600);
          });
        }, 2200);
      });
    };

    timer = setTimeout(cycle, 1800);

    // Stop while the tab is in the background: a board clattering in a tab
    // nobody is looking at is pure battery.
    const onVis = () => { paused.current = document.hidden; };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
    // Runs once: `text` is read through the closure on purpose so a re-render
    // mid-flip does not restart the sequence.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seats.length]);

  const hold = () => { paused.current = true; };
  const release = () => { paused.current = false; };

  return (
    <section
      className="board"
      aria-labelledby="seats-h"
      onMouseEnter={hold}
      onMouseLeave={release}
      onFocusCapture={hold}
      onBlurCapture={release}
      ref={boardRef as React.Ref<HTMLDivElement>}
    >
      <div className="board-head">
        <h2 id="seats-h">Sponsor board</h2>
        <span className="board-sub">
          {open.length === seats.length
            ? `All ${seats.length} open`
            : open.length === 0
              ? "Sold out"
              : `${open.length} of ${seats.length} open`}{" "}
          · {data.price.said} ·{" "}
          <a href={data.terms}>what a seat buys</a>
        </span>
      </div>

      <div className="board-cols" aria-hidden="true">
        <span>Seat</span>
        <span>Sponsor</span>
        <span>Status</span>
      </div>

      <ul className="board-rows">
        {seats.map((s) => {
          // Demonstrating means the field is actually showing the mark, not
          // merely that this seat is the loop's current target.
          const isDemo = demo === s.n && !s.sponsor && text !== EMPTY;
          const cells = s.sponsor ? pad(s.sponsor.name.toUpperCase()) : isDemo ? text : EMPTY;
          return (
            <li key={s.n} className={`brow${s.sponsor ? " is-taken" : ""}${isDemo ? " is-demo" : ""}`}>
              <span className="bseat">{String(s.n).padStart(2, "0")}</span>
              {s.sponsor ? (
                <a
                  className="bcells"
                  href={s.sponsor.url}
                  rel="sponsored nofollow noopener"
                  target="_blank"
                  title={s.sponsor.name}
                >
                  {cells.split("").map((c, i) => (
                    <b key={i} className="cell">{c === " " ? " " : c}</b>
                  ))}
                </a>
              ) : (
                <a className="bcells" href={buy} aria-label={`Seat ${s.n} is open — ${data.price.said}`}>
                  {cells.split("").map((c, i) => (
                    <b key={i} className="cell">{c === " " ? " " : c}</b>
                  ))}
                </a>
              )}
              <span className="bstat">
                {s.sponsor ? (
                  <span className="tag-sponsor">Sponsor</span>
                ) : isDemo ? (
                  <span className="tag-specimen">Specimen</span>
                ) : (
                  <a className="tag-open" href={buy}>
                    Open <i>{data.price.said}</i>
                  </a>
                )}
              </span>
              {s.sponsor?.line && <p className="bline">{s.sponsor.line}</p>}
            </li>
          );
        })}
      </ul>

      <p className="board-foot">
        Advertising. <strong>A seat buys the board and nothing else</strong> — no row in the
        registry, no place on a shelf, no tag, no receipt, no rank, and no say in what gets listed
        or how it is described. The {site} data is built from a public registry by a script that
        cannot read this file, so a sponsor has never been able to move a number in it. That is the
        whole product: if a seat could bend it, there would be nothing left worth sponsoring.
      </p>
    </section>
  );
}
