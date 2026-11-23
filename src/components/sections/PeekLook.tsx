"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Box = { top: number; left: number; width: number; height: number };
type Shot = { src: string; caption?: string };

const Z = 2.6; /* lens magnification */
const PZ = 2.2; /* click-to-zoom level */

export default function PeekLook({
  shots,
  index,
  onIndex,
  from,
  color,
  onClose,
}: {
  shots: Shot[];
  index: number;
  onIndex: (i: number) => void;
  from: Box;
  color: string;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pic = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const xBtn = useRef<HTMLButtonElement>(null);
  const qx = useRef<((v: number) => unknown) | null>(null);
  const qy = useRef<((v: number) => unknown) | null>(null);
  const closing = useRef(false);
  const reduced = useRef(false);
  const zoomRef = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [dim, setDim] = useState({ w: 0, h: 0 });
  const [zoomed, setZoomed] = useState(false);
  zoomRef.current = zoomed;

  const n = shots.length;
  const shot = shots[index % n];

  const clipFrom = () =>
    `inset(${from.top}px ${window.innerWidth - from.left - from.width}px ${
      window.innerHeight - from.top - from.height
    }px ${from.left}px round 10px)`;

  /* grow out of the screenshot window */
  useLayoutEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.current,
        { clipPath: clipFrom() },
        { clipPath: "inset(0px 0px 0px 0px round 0px)", duration: 0.75, ease: "power3.inOut" }
      );
      gsap.fromTo(
        ".lk__in",
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.06, delay: 0.4, ease: "power2.out" }
      );
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (reduced.current || !root.current) {
      onClose();
      return;
    }
    gsap
      .timeline({ onComplete: onClose })
      .to(".lk__in", { opacity: 0, duration: 0.2 }, 0)
      .to(root.current, { clipPath: clipFrom(), duration: 0.6, ease: "power3.inOut" }, 0.08);
  };

  const closeRef = useRef(close);
  closeRef.current = close;
  const stepRef = useRef((d: number) => {
    void d;
  });
  stepRef.current = (d: number) => onIndex((index + d + n) % n);

  /* keys, and keep the page behind it still */
  useEffect(() => {
    xBtn.current?.focus({ preventScroll: true });
    if (img.current) {
      qx.current = gsap.quickTo(img.current, "x", { duration: 0.45, ease: "power3.out" });
      qy.current = gsap.quickTo(img.current, "y", { duration: 0.45, ease: "power3.out" });
    }

    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        stepRef.current(e.key === "ArrowRight" ? 1 : -1);
      } else if ([" ", "ArrowUp", "ArrowDown", "PageUp", "PageDown"].includes(e.key)) {
        const tag = (e.target as HTMLElement).tagName;
        if (tag !== "BUTTON") {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener("keydown", key, true);

    const el = root.current!;
    const stop = (e: Event) => e.preventDefault();
    el.addEventListener("wheel", stop, { passive: false });
    el.addEventListener("touchmove", stop, { passive: false });
    return () => {
      window.removeEventListener("keydown", key, true);
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
    };
  }, []);

  /* learn the picture's real size whenever the shot changes */
  useEffect(() => {
    let live = true;
    const im = new Image();
    im.onload = () => {
      if (live) setNat({ w: im.naturalWidth, h: im.naturalHeight });
    };
    im.src = shot.src;
    setZoomed(false);
    if (img.current) gsap.set(img.current, { scale: 1, x: 0, y: 0 });
    return () => {
      live = false;
    };
  }, [shot.src]);

  /* fit the whole picture inside the stage, never cropped */
  useEffect(() => {
    const m = () => {
      if (!stage.current || !nat.w) return;
      const r = stage.current.getBoundingClientRect();
      const padH = window.innerWidth <= 860 ? 24 : 144;
      const aw = Math.max(50, r.width - padH - 24);
      const ah = Math.max(50, r.height - 24);
      const s = Math.min(aw / nat.w, ah / nat.h, 1.6);
      setDim({ w: Math.round(nat.w * s), h: Math.round(nat.h * s) });
    };
    m();
    window.addEventListener("resize", m);
    return () => window.removeEventListener("resize", m);
  }, [nat]);

  /* each new shot slides in */
  useEffect(() => {
    if (!nat.w || reduced.current || !pic.current) return;
    gsap.fromTo(pic.current, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45, ease: "power2.out" });
  }, [nat]);

  /* lens follows the pointer, or the picture pans when zoomed */
  const track = (e: { clientX: number; clientY: number }) => {
    if (!pic.current) return;
    const r = pic.current.getBoundingClientRect();
    const px = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const py = Math.min(Math.max(e.clientY - r.top, 0), r.height);
    if (zoomRef.current) {
      qx.current?.(-px * (PZ - 1));
      qy.current?.(-py * (PZ - 1));
    }
    const l = lens.current;
    if (l) {
      const S = l.offsetWidth;
      gsap.set(l, { x: e.clientX - S / 2, y: e.clientY - S / 2 });
      l.style.backgroundSize = `${r.width * Z}px ${r.height * Z}px`;
      l.style.backgroundPosition = `${S / 2 - px * Z}px ${S / 2 - py * Z}px`;
    }
  };

  const toggle = (e: React.MouseEvent) => {
    const z = !zoomRef.current;
    zoomRef.current = z;
    setZoomed(z);
    if (!img.current) return;
    const d = reduced.current ? 0 : 0.5;
    gsap.to(img.current, { scale: z ? PZ : 1, duration: d, ease: "power3.out" });
    if (z) track(e);
    else gsap.to(img.current, { x: 0, y: 0, duration: d, ease: "power3.out", overwrite: "auto" });
  };

  if (!shot) return null;

  return (
    <div
      ref={root}
      className="lk"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot viewer"
      style={{ ["--c2" as string]: color }}
    >
      <div className="lk__top lk__in">
        <p>
          <b>{String(index + 1).padStart(2, "0")}</b>/{String(n).padStart(2, "0")}
          {shot.caption ? ` · ${shot.caption}` : ""}
        </p>
        <button ref={xBtn} className="lk__x" onClick={close} aria-label="Back to the project">
          <X size={20} />
        </button>
      </div>

      <div ref={stage} className="lk__stage">
        {n > 1 && (
          <button className="lk__nav lk__nav--l lk__in" onClick={() => stepRef.current(-1)} aria-label="Previous screen">
            <ChevronLeft size={22} />
          </button>
        )}

        <div className="lk__frame" style={{ opacity: dim.w ? 1 : 0 }}>
          <i />
          <i />
          <i />
          <i />
          <div
            ref={pic}
            className={`lk__pic ${zoomed ? "is-zoomed" : ""}`}
            style={{ width: dim.w, height: dim.h }}
            onPointerMove={track}
            onPointerDown={(e) => {
              track(e);
              swipe.current = { x: e.clientX, y: e.clientY };
              swiped.current = false;
            }}
            onPointerUp={(e) => {
              const s0 = swipe.current;
              swipe.current = null;
              if (!s0 || e.pointerType === "mouse" || zoomRef.current) return;
              const dx = e.clientX - s0.x;
              const dy = e.clientY - s0.y;
              if (n > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                swiped.current = true;
                stepRef.current(dx < 0 ? 1 : -1);
              }
            }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") lens.current?.classList.add("is-on");
            }}
            onPointerLeave={() => lens.current?.classList.remove("is-on")}
            onClick={(e) => {
              if (swiped.current) {
                swiped.current = false;
                return;
              }
              toggle(e);
            }}
          >
            <img ref={img} src={shot.src} alt={shot.caption ?? ""} draggable={false} />
          </div>
        </div>

        {n > 1 && (
          <button className="lk__nav lk__nav--r lk__in" onClick={() => stepRef.current(1)} aria-label="Next screen">
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      <p className="lk__hint lk__in">
        <span className="lk__h-mouse">Hover to magnify · Click to zoom and pan · ← → to browse · Esc to go back</span>
        <span className="lk__h-touch">Tap to zoom · drag to pan · swipe to browse</span>
      </p>

      <div
        ref={lens}
        className={`lk__lens ${zoomed ? "is-off" : ""}`}
        style={{ backgroundImage: `url("${shot.src}")` }}
        aria-hidden="true"
      />
    </div>
  );
}
