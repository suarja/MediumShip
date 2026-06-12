"use client";

import { useEffect } from "react";

/**
 * Progressive scroll-reveal for `.section` elements. Adds `reveal-ready` to
 * <body> (so the hidden initial state in globals.css only applies when JS is
 * live), then reveals each section once its top crosses into the viewport.
 *
 * Uses a rAF-throttled scroll pass rather than IntersectionObserver so that
 * anchor jumps (the nav links — #premium, #variants, …) and fast/instant
 * scrolls never leave a skipped-over section stuck at opacity:0 when the user
 * scrolls back up. Honours prefers-reduced-motion by not engaging at all.
 */
export function RevealController() {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReducedMotion) return;

    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("main .section"),
    );
    if (sections.length === 0) return;

    document.body.classList.add("reveal-ready");

    const reveal = () => {
      const threshold = window.innerHeight * 0.9;
      for (const section of sections) {
        if (
          !section.classList.contains("is-visible") &&
          section.getBoundingClientRect().top < threshold
        ) {
          section.classList.add("is-visible");
        }
      }
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        reveal();
        ticking = false;
      });
    };

    reveal(); // initial above-the-fold pass
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.body.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
