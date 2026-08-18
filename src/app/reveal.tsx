"use client";

import { useEffect } from "react";

// Turns on the scroll reveal, and nothing else.
//
// The whole effect is two CSS rules and one observer. It is written as an
// upgrade rather than a feature: the page ships fully visible, this adds a
// class to <html> that *introduces* the hidden state, then removes it element
// by element as each scrolls into view. If this component never runs — no JS,
// a bundle that 404s, a browser without IntersectionObserver — the reader gets
// the page at rest instead of a blank screen. That ordering is the only reason
// a fade-in is acceptable on a reference site at all.
export default function Reveal() {
  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) return;

    const targets = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!targets.length) return;

    // Index within the reveal group, for the stagger. Read here rather than
    // written into the markup so the server output stays free of presentation
    // indices that mean nothing without this file.
    const groups = new Map<string, number>();
    for (const el of targets) {
      const group = el.dataset.reveal || "";
      const i = groups.get(group) ?? 0;
      groups.set(group, i + 1);
      el.style.setProperty("--i", String(i));
    }

    root.classList.add("reveal-ready");

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      },
      // A little below the fold, so a section has finished arriving by the time
      // it is worth reading. rootMargin, not a timer — the trigger should be
      // the reader's scroll, not a guess about how fast they read.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.01 },
    );

    // Anything already on screen at load is shown immediately rather than
    // faded: a reveal that plays on content the reader is already looking at
    // is just a delay.
    for (const el of targets) {
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.9) el.classList.add("in");
      else io.observe(el);
    }

    // If the reader turns reduced motion on mid-visit, drop the whole thing.
    const stop = () => {
      if (!reduced.matches) return;
      io.disconnect();
      root.classList.remove("reveal-ready");
    };
    reduced.addEventListener("change", stop);

    return () => {
      io.disconnect();
      reduced.removeEventListener("change", stop);
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
