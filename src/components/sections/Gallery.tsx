"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import wall from "@/data/gallery.json";
import artData from "@/data/art.json";
import { notes } from "@/data/artworks";
import { cafe } from "@/lib/audio";

type Frame = { x: number; y: number; w: number; h: number };
type Piece = { src: string; title: string; file: string } | null;

const frames = wall.frames as Frame[];
const pieces = artData as unknown as Piece[];
const filled = pieces.map((p, i) => (p ? i : -1)).filter((i) => i >= 0);
const ASPECT = wall.aspect;
const GX = 0.12; /* the art tucks this far under the frame, in % of the wall width */
const GY = GX * ASPECT;

const pad = (n: number) => String(n).padStart(2, "0");
const find = (el: HTMLElement | null, s: string) => el?.querySelector(s) as HTMLElement | null;
const titleOf = (p: NonNullable<Piece>) => notes[p.file]?.title ?? p.title;

export default function Gallery({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const focusRef = useRef(-1);
  const wasOpen = useRef(false);
  const [focus, setFocus] = useState(-1);
  const [hover, setHover] = useState(-1);

  /* camera glides to a frame and its panel opens */
  const look = useCallback((i: number) => {
    const el = root.current;
    const c = find(el, ".gallery__cam");
    const stage = find(el, ".gallery__stage");
    if (!c || !stage || !pieces[i]) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const small = vw < 800;
    const f = frames[i];
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    const ox = stage.offsetLeft;
    const oy = stage.offsetTop;
    const fw = (f.w / 100) * sw;
    const fh = (f.h / 100) * sh;
    const availW = small ? vw * 0.8 : vw * 0.5;
    const availH = small ? vh * 0.42 : vh * 0.66;
    const s = gsap.utils.clamp(1.15, 8, Math.min(availW / fw, availH / fh));
    const px = ox + ((f.x + f.w / 2) / 100) * sw;
    const py = oy + ((f.y + f.h / 2) / 100) * sh;
    const tx = small ? vw * 0.5 : vw * 0.34;
    const ty = small ? vh * 0.3 : vh * 0.5;
    gsap.to(stage, { x: 0, y: 0, duration: 0.8, ease: "power3.out", overwrite: "auto" });
    gsap.to(c, {
      scale: s,
      x: gsap.utils.clamp(vw - s * (ox + sw), -s * ox, tx - s * px),
      y: gsap.utils.clamp(vh - s * (oy + sh), -s * oy, ty - s * py),
      duration: 1.2,
      ease: "expo.inOut",
      overwrite: true,
    });
    focusRef.current = i;
    setFocus(i);
    cafe.setFocus(true);
  }, []);

  const unlook = useCallback(() => {
    const c = find(root.current, ".gallery__cam");
    if (c) gsap.to(c, { scale: 1, x: 0, y: 0, duration: 1.1, ease: "expo.inOut", overwrite: true });
    focusRef.current = -1;
    setFocus(-1);
    cafe.setFocus(false);
    cafe.play("whoosh");
  }, []);

  const step = useCallback(
    (dir: number) => {
      if (!filled.length) return;
      const pos = filled.indexOf(focusRef.current);
      const next =
        pos < 0
          ? dir > 0
            ? filled[0]
            : filled[filled.length - 1]
          : filled[(pos + dir + filled.length) % filled.length];
      look(next);
      cafe.play("page");
    },
    [look]
  );

  /* open and close: the wall fades in and the art reveals frame by frame */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      wasOpen.current = true;
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: reduce ? 1 : 1.14 },
        { autoAlpha: 1, scale: 1, duration: reduce ? 0.3 : 1, ease: "power3.out" }
      );
      if (!reduce) {
        gsap.fromTo(
          el.querySelectorAll(".gal__art"),
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 0.9,
            ease: "power3.inOut",
            stagger: { each: 0.05, from: "random" },
            delay: 0.5,
            clearProps: "clipPath",
          }
        );
      }
    } else if (wasOpen.current) {
      wasOpen.current = false;
      gsap.killTweensOf(el);
      gsap.to(el, { autoAlpha: 0, duration: 0.6, ease: "power2.in" });
      const c = find(el, ".gallery__cam");
      if (c) gsap.to(c, { scale: 1, x: 0, y: 0, duration: 0.6, ease: "power2.inOut", overwrite: true });
      focusRef.current = -1;
      setFocus(-1);
      setHover(-1);
      cafe.setFocus(false);
    }
  }, [open]);

  /* keyboard: Esc steps back one level, arrows move between frames */
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (focusRef.current >= 0) unlook();
        else onClose();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, onClose, unlook, step]);

  /* wheel: moves between frames while one is open, and never scrolls the page */
  useEffect(() => {
    const el = root.current;
    if (!el || !open) return;
    let acc = 0;
    let lock = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (focusRef.current < 0) return;
      const t = performance.now();
      if (t < lock) return;
      if (t - last > 250) acc = 0;
      last = t;
      acc += e.deltaY;
      if (Math.abs(acc) < 45) return;
      const dir = acc > 0 ? 1 : -1;
      acc = 0;
      lock = t + 1000;
      step(dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [open, step]);

  /* a little parallax while you look at the whole wall */
  useEffect(() => {
    const el = root.current;
    if (!el || !open) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = find(el, ".gallery__stage")!;
    const mx = gsap.quickTo(stage, "x", { duration: 0.9, ease: "power3" });
    const my = gsap.quickTo(stage, "y", { duration: 0.9, ease: "power3" });
    const move = (e: PointerEvent) => {
      if (focusRef.current >= 0) return;
      mx(-(e.clientX / window.innerWidth - 0.5) * 16);
      my(-(e.clientY / window.innerHeight - 0.5) * 10);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [open]);

  const piece = focus >= 0 ? pieces[focus] : null;
  const note = piece ? notes[piece.file] : undefined;
  const hoverPiece = hover >= 0 ? pieces[hover] : null;
  const tip = hover < 0 ? "" : hoverPiece ? `${pad(hover + 1)} · ${titleOf(hoverPiece)}` : `Frame ${pad(hover + 1)} · empty`;

  return (
    <div
      ref={root}
      className={`gallery ${open ? "is-open" : ""} ${focus >= 0 ? "has-focus" : ""}`}
      data-lenis-prevent
      aria-hidden={!open}
      style={{ ["--ga" as string]: ASPECT, background: wall.bg }}
    >
      <div className="gallery__cam">
        <div className="gallery__stage">
          {frames.map((f, i) => {
            const p = pieces[i];
            return (
              <div
                key={`a${i}`}
                className={`gal__art ${p ? "" : "is-empty"} ${hover === i ? "is-hover" : ""} ${focus === i ? "is-focus" : ""}`}
                style={{
                  left: `${f.x - GX}%`,
                  top: `${f.y - GY}%`,
                  width: `${f.w + GX * 2}%`,
                  height: `${f.h + GY * 2}%`,
                }}
              >
                {p ? <Image src={p.src} alt={titleOf(p)} fill sizes="70vw" /> : <span className="gal__num">{pad(i + 1)}</span>}
              </div>
            );
          })}

          <Image className="gallery__wall" src="/images/gallery-wall.png" alt="A wall of framed artworks" fill sizes="100vw" />

          {frames.map((f, i) => (
            <button
              key={`h${i}`}
              className="gal__hit"
              style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
              onClick={() => (pieces[i] ? look(i) : cafe.play("tick"))}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(-1)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(-1)}
              tabIndex={open ? 0 : -1}
              aria-label={pieces[i] ? `Look closer: ${titleOf(pieces[i]!)}` : `Empty frame ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="gallery__vig" aria-hidden="true" />

      <p className="gal__hint">{filled.length ? "Click a frame to look closer" : "Empty frames: add images to public/gallery"}</p>

      <button className="gal__back" onClick={onClose} tabIndex={open ? 0 : -1}>
        <ArrowLeft size={16} /> Back to the room
      </button>

      <div className={`gal__tip ${hover >= 0 && focus < 0 ? "is-on" : ""}`} aria-hidden="true">
        {tip}
      </div>

      <aside className={`gpanel ${piece ? "is-on" : ""}`} aria-live="polite">
        {piece && (
          <>
            <button className="gpanel__close" onClick={unlook} aria-label="Close">
              <X size={18} />
            </button>
            <span className="gpanel__kicker">
              Art wall · {pad(focus + 1)} / {pad(frames.length)}
            </span>
            <h3>{titleOf(piece)}</h3>
            {note?.note && <p>{note.note}</p>}
            <ul className="gpanel__meta">
              <li>Made with code</li>
              {note?.made && <li>{note.made}</li>}
              {note?.year && <li>{note.year}</li>}
            </ul>
            <div className="gpanel__nav">
              <button onClick={() => step(-1)}>
                <ArrowLeft size={16} /> Prev
              </button>
              <button onClick={() => step(1)}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
