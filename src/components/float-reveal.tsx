import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

const SELECTOR = [
  "main h1", "main h2", "main section > div", "main form",
  "main .rounded-2xl", "main .rounded-3xl", "main table", "footer > div",
].join(",");

/**
 * Makes page blocks float in smoothly as they enter the screen instead of popping in.
 * Runs only in the browser after hydration, so content is never hidden for search engines.
 */
export function FloatReveal() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add("float-in");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 },
    );

    const scan = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR));
      let i = 0;
      for (const el of els) {
        if (el.dataset.float) continue;
        // Skip blocks nested in an already-animated block to avoid double motion
        if (el.parentElement?.closest("[data-float]")) { el.dataset.float = "skip"; continue; }
        el.dataset.float = "1";
        el.style.setProperty("--float-delay", `${Math.min(i++ % 6, 5) * 70}ms`);
        el.classList.add("float-pre");
        io.observe(el);
      }
    };

    scan();
    const mo = new MutationObserver(() => scan());
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [path]);

  return null;
}
