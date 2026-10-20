"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, Globe } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { works, type Work } from "@/data/work";
import { profile } from "@/data/profile";
import wall from "@/data/workwall.json";
import Archive from "@/components/sections/Archive";

type Frame = { x: number; y: number; w: number; h: number };
const frames = wall.frames as Frame[];
const GX = 0.12; /* the poster tucks this far under the frame, in % of the wall width */
const GY = GX * wall.aspect;

/* the vinyl crate on the wall: the way into the archive. x, y, w, h are % of the wall picture */
const CRATE = { x: 16.6, y: 71, w: 26.4, h: 15 };

const invite: Work = {
  slug: "next",
  title: "Next",
  subtitle: "Your project goes here",
  colors: ["#e8531f", "#8fc1d4"],
  mockup: "",
  specs: ["Open for work", "Design + build", "Let's talk"],
};

const pad = (n: number) => String(n).padStart(2, "0");
const sizeOf = (t: string) => Math.max(8, Math.min(20, 84 / (0.6 * t.length)));

export default function WorkWall({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const timer = useRef(0);
  const [note, setNote] = useState("");
  const [hover, setHover] = useState(-1);
  const [tip, setTip] = useState(0);
  const [arch, setArch] = useState(false);
  const archRef = useRef(false);

  const items = frames.map((_, i) => works[i] ?? invite);

  const press = (i: number) => {
    const w = items[i];
    const el = root.current?.querySelectorAll(".wp")[i] as HTMLElement | undefined;
    if (el && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(el, { scale: 0.96 }, { scale: 1, duration: 0.8, ease: "elastic.out(1, 0.4)" });
    }
    if (w.slug === "next") {
      window.location.href = `mailto:${profile.email}`;
      return;
    }
    setNote(`${w.title}: the full project page comes next.`);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNote(""), 3200);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  /* open and close: fade in, posters wipe in one after another */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      wasOpen.current = true;
      gsap.killTweensOf(el);
      gsap.fromTo(
        el,
        { autoAlpha: 0, scale: reduce ? 1 : 1.12 },
        { autoAlpha: 1, scale: 1, duration: reduce ? 0.3 : 1, ease: "power3.out" }
      );
      if (!reduce) {
        gsap.fromTo(
          el.querySelectorAll(".wp"),
          { clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0 0 0% 0)",
            duration: 0.9,
            ease: "power3.inOut",
            stagger: { each: 0.1, from: "random" },
            delay: 0.5,
            clearProps: "clipPath",
          }
        );
      }
    } else if (wasOpen.current) {
      wasOpen.current = false;
      gsap.killTweensOf(el);
      gsap.to(el, { autoAlpha: 0, duration: 0.6, ease: "power2.in" });
      setHover(-1);
      setNote("");
      archRef.current = false;
      setArch(false);
    }
  }, [open]);

  /* Esc closes, and the wheel never scrolls the page behind it */
  useEffect(() => {
    const el = root.current;
    if (!el || !open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (archRef.current) {
          archRef.current = false;
          setArch(false);
        } else onClose();
      }
    };
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest(".archive__inner")) return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("keydown", key);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      window.removeEventListener("keydown", key);
      el.removeEventListener("wheel", wheel);
    };
  }, [open, onClose]);

  const t = frames[tip];

  return (
    <div
      ref={root}
      className={`wallv ${open ? "is-open" : ""}`}
      data-lenis-prevent
      aria-hidden={!open}
      style={{ background: wall.bg, ["--wa" as string]: wall.aspect }}
    >
      <div className={`wallv__stage ${hover >= 0 ? "has-hover" : ""}`}>
        {frames.map((f, i) => {
          const w = items[i];
          return (
            <div
              key={`p${i}`}
              className={`wp ${hover === i ? "is-hover" : ""}`}
              style={{
                left: `${f.x - GX}%`,
                top: `${f.y - GY}%`,
                width: `${f.w + GX * 2}%`,
                height: `${f.h + GY * 2}%`,
                ["--c1" as string]: w.colors[0],
                ["--c2" as string]: w.colors[1],
                ["--fs" as string]: sizeOf(w.title),
              }}
            >
              <span className="wp__paper">
                <span className="wp__head">
                  <span className="wp__title">{w.title}</span>
                  <span className="wp__sub">{w.subtitle}</span>
                  <span className="wp__sw">
                    <i />
                    <i />
                  </span>
                </span>
                <span className="wp__mock">
                  {w.mockup ? (
                    <img src={w.mockup} alt="" loading="lazy" draggable={false} />
                  ) : (
                    <span className="wp__blank">+</span>
                  )}
                </span>
                <span className="wp__ground" />
                <span className="wp__specs">
                  {w.specs.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </span>
                <span className="wp__ed">
                  <Globe strokeWidth={1.2} />/{pad(i + 1)}
                </span>
              </span>
            </div>
          );
        })}

        <Image className="wallv__img" src="/images/work-wall.png" alt="A wall of framed project posters" fill sizes="100vw" />

        <button
          className="crate"
          style={{ left: `${CRATE.x}%`, top: `${CRATE.y}%`, width: `${CRATE.w}%`, height: `${CRATE.h}%` }}
          onClick={() => {
            archRef.current = true;
            setArch(true);
          }}
          tabIndex={open ? 0 : -1}
          aria-label="Open the archive"
        >
          <span className="crate__dot" />
          <span className="crate__tag">Archive</span>
        </button>

        {frames.map((f, i) => (
          <button
            key={`h${i}`}
            className="wp__hit"
            style={{ left: `${f.x}%`, top: `${f.y}%`, width: `${f.w}%`, height: `${f.h}%` }}
            onClick={() => press(i)}
            onPointerEnter={() => {
              setHover(i);
              setTip(i);
            }}
            onPointerLeave={() => setHover(-1)}
            onFocus={() => {
              setHover(i);
              setTip(i);
            }}
            onBlur={() => setHover(-1)}
            tabIndex={open ? 0 : -1}
            aria-label={`${items[i].title}, ${items[i].subtitle}. View project ${i + 1}`}
          />
        ))}

        <span
          className={`wallv__chip ${hover >= 0 ? "is-on" : ""}`}
          style={{ left: `${t.x + t.w / 2}%`, top: `${t.y + t.h}%` }}
          aria-hidden="true"
        >
          {pad(tip + 1)} · {items[tip].title} · View ↗
        </span>
      </div>

      <Archive
        open={arch}
        onClose={() => {
          archRef.current = false;
          setArch(false);
        }}
      />

      <button className="wallv__back" onClick={onClose} tabIndex={open ? 0 : -1}>
        <ArrowLeft size={16} /> Back to the room
      </button>

      <p className={`wallv__note ${note ? "is-on" : ""}`} role="status">
        {note}
      </p>
    </div>
  );
}
