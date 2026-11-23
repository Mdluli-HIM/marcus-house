"use client";

import { useEffect, type RefObject } from "react";

/* phones: tells the info card when there is more to scroll to */
export default function PanelCue({ rootRef, active }: { rootRef: RefObject<HTMLElement | null>; active: boolean }) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !active) return;
    if (!window.matchMedia("(max-width: 800px)").matches) return;

    const set = (el: Element, cls: string, on: boolean) => {
      if (el.classList.contains(cls) !== on) el.classList.toggle(cls, on);
    };
    const upd = () => {
      const p = root.querySelector(".panel.is-on");
      if (!p) return;
      set(p, "can-scroll", p.scrollHeight > p.clientHeight + 4);
      set(p, "at-end", p.scrollTop + p.clientHeight >= p.scrollHeight - 6);
    };

    root.addEventListener("scroll", upd, true);
    const t = window.setInterval(upd, 250);
    upd();
    return () => {
      root.removeEventListener("scroll", upd, true);
      window.clearInterval(t);
    };
  }, [rootRef, active]);

  return null;
}
