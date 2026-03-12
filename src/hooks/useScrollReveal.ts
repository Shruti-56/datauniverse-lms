import { useEffect, useState } from "react";

/**
 * Hook to reveal elements when they enter the viewport.
 * Use with .lp-reveal class; adds .lp-visible when in view.
 */
export function useScrollReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".lp-reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lp-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/**
 * Hook to show sticky CTA bar after scrolling past hero.
 */
export function useStickyCta(showAfterPx = 400) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > showAfterPx);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [showAfterPx]);

  return visible;
}
