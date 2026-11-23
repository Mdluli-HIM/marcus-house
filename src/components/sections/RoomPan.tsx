"use client";

import { useEffect, useState, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

/* touch screens: drag sideways to look around, swipe up or down to tour the points */
export default function RoomPan({
  rootRef,
  active,
}: {
  rootRef: RefObject<HTMLElement | null>;
  active: boolean;
}) {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !active) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    let seen = false;
    try {
      seen = sessionStorage.getItem("marcus:pan") === "1";
    } catch {}
    let hideT: number | undefined;
    if (!seen) {
      setHint(true);
      hideT = window.setTimeout(() => setHint(false), 7000);
    }
    const markSeen = () => {
      setHint(false);
      try {
        sessionStorage.setItem("marcus:pan", "1");
      } catch {}
    };

    const cam = () => root.querySelector(".inside__cam") as HTMLElement | null;
    const bounds = () => {
      const stage = root.querySelector(".inside__stage") as HTMLElement | null;
      if (!stage) return { min: 0, max: 0 };
      const vw = window.innerWidth;
      return {
        min: Math.min(0, vw - stage.offsetLeft - stage.offsetWidth),
        max: Math.max(0, -stage.offsetLeft),
      };
    };

    let id = -1;
    let sx = 0;
    let sy = 0;
    let cx = 0;
    let last = 0;
    let lastT = 0;
    let vx = 0;
    let mode: "" | "h" | "v" | "x" = "";
    let blockClick = false;
    let lastStep = 0;

    const step = (d: number) => {
      const now = performance.now();
      if (now - lastStep < 800) return;
      lastStep = now;
      window.dispatchEvent(new CustomEvent("marcus:room-step", { detail: d }));
    };

    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      if (!(e.target as HTMLElement).closest(".inside__cam")) return;
      const c = cam();
      if (!c) return;
      id = e.pointerId;
      sx = e.clientX;
      sy = e.clientY;
      cx = Number(gsap.getProperty(c, "x"));
      last = e.clientX;
      lastT = e.timeStamp;
      vx = 0;
      mode = "";
      gsap.killTweensOf(c, "x");
    };

    const move = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      const c = cam();
      if (!c) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (!mode) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 10) return;
        mode = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        /* sideways panning only when the camera is not zoomed into a point */
        if (mode === "h" && Math.abs(Number(gsap.getProperty(c, "scale")) - 1) > 0.02) mode = "x";
        markSeen();
      }
      if (mode !== "h") return;
      const b = bounds();
      gsap.set(c, { x: gsap.utils.clamp(b.min, b.max, cx + dx) });
      const dt = e.timeStamp - lastT;
      if (dt > 0) vx = (e.clientX - last) / dt;
      last = e.clientX;
      lastT = e.timeStamp;
    };

    const up = (e: PointerEvent) => {
      if (e.pointerId !== id) return;
      id = -1;
      const m = mode;
      mode = "";
      if (!m) return;
      blockClick = true;
      window.setTimeout(() => {
        blockClick = false;
      }, 60);
      if (m === "v") {
        const dy = e.clientY - sy;
        if (Math.abs(dy) > 50) step(dy < 0 ? 1 : -1);
        return;
      }
      if (m !== "h") return;
      const c = cam();
      if (!c) return;
      const b = bounds();
      const x = Number(gsap.getProperty(c, "x"));
      gsap.to(c, { x: gsap.utils.clamp(b.min, b.max, x + vx * 260), duration: 0.8, ease: "power3.out" });
    };

    const click = (e: Event) => {
      if (blockClick) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    root.addEventListener("pointerdown", down);
    root.addEventListener("pointermove", move);
    root.addEventListener("pointerup", up);
    root.addEventListener("pointercancel", up);
    root.addEventListener("click", click, true);
    return () => {
      window.clearTimeout(hideT);
      root.removeEventListener("pointerdown", down);
      root.removeEventListener("pointermove", move);
      root.removeEventListener("pointerup", up);
      root.removeEventListener("pointercancel", up);
      root.removeEventListener("click", click, true);
    };
  }, [rootRef, active]);

  return hint ? (
    <div className="roompan" aria-hidden="true">
      ↑ Swipe up to tour the room
    </div>
  ) : null;
}
