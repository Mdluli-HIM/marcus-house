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
import ProjectPage, { type Origin } from "@/components/sections/ProjectPage";

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
  const [page, setPage] = useState(0);
  const [pageOpen, setPageOpen] = useState(false);
  const [origin, setOrigin] = useState<Origin>(null);
  const pageRef = useRef(false);
  const bootPage = useRef(-1);
  const livePage = useRef(false);
  useEffect(() => {
    try {
      bootPage.current = parseInt(sessionStorage.getItem("marcus:page") ?? "-1", 10);
    } catch {}
  }, []);
  useEffect(() => {
    if (!open) return;
    if (bootPage.current >= 0) {
      const i = bootPage.current;
      bootPage.current = -1;
      setOrigin(null);
      setPage(i);
      pageRef.current = true;
      setPageOpen(true);
    }
    livePage.current = true;
  }, [open]);
  useEffect(() => {
    if (!livePage.current) return;
    try {
      sessionStorage.setItem("marcus:page", pageOpen ? String(page) : "-1");
    } catch {}
  }, [pageOpen, page]);

  const items = frames.map((_, i) => works[i] ?? invite);

  const press = (i: number) => {
    const w = items[i];
    const el = root.current?.querySelectorAll(".wp")[i] as HTMLElement | undefined;
    if (el && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      /* the poster grows into the project page instead */
    }
    if (w.slug === "next") {
      window.location.href = `mailto:${profile.email}`;
      return;
    }
    const hit = root.current?.querySelectorAll(".wp__hit")[i] as HTMLElement | undefined;
    const r = hit?.getBoundingClientRect();
    setOrigin(r ? { x: r.left, y: r.top, w: r.width, h: r.height } : null);
    setPage(i);
    pageRef.current = true;
    setPageOpen(true);
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
      pageRef.current = false;
      setPageOpen(false);
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
        if (pageRef.current) {
          pageRef.current = false;
          setPageOpen(false);
        } else if (archRef.current) {
          archRef.current = false;
          setArch(false);
        } else onClose();
      }
    };
    const wheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest(".archive__inner, .pgv__scroll")) return;
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

  const cam = useRef<HTMLDivElement>(null);
  const leaveT = useRef(0);

  /* push the camera into a frame. It scales about the frame's own centre, so the pointer
     stays inside the frame as it grows, and it only shifts to keep the frame on screen. */
  const zoomTo = (i: number) => {
    window.clearTimeout(leaveT.current);
    const el = root.current;
    const c = cam.current;
    const st = el?.querySelector(".wallv__stage") as HTMLElement | null;
    if (!el || !c || !st) return;
    if (window.matchMedia("(hover: none)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const sw = st.offsetWidth;
    const sh = st.offsetHeight;
    const left = st.offsetLeft - sw / 2;
    const top = st.offsetTop - sh / 2;
    const f = frames[i];
    const fw = (f.w / 100) * sw;
    const fh = (f.h / 100) * sh;
    const px = left + ((f.x + f.w / 2) / 100) * sw;
    const py = top + ((f.y + f.h / 2) / 100) * sh;
    const k = Math.max(1.2, Math.min(3.4, Math.min((vw * 0.5) / fw, (vh * 0.68) / fh)));
    const edge = (lo: number, hi: number) => Math.max(lo, Math.min(hi, 0));
    const dx = edge(24 - (px - (k * fw) / 2), vw - 24 - (px + (k * fw) / 2));
    const dy = edge(24 - (py - (k * fh) / 2), vh - 72 - (py + (k * fh) / 2));
    gsap.to(c, { scale: k, x: px * (1 - k) + dx, y: py * (1 - k) + dy, duration: 0.9, ease: "power3.inOut", overwrite: true });
  };

  const pullBack = () => {
    if (cam.current) gsap.to(cam.current, { scale: 1, x: 0, y: 0, duration: 0.8, ease: "power3.inOut", overwrite: true });
  };

  /* a short delay, so crossing the gap between two frames does not pull back and push in again */
  const leave = () => {
    setHover(-1);
    window.clearTimeout(leaveT.current);
    leaveT.current = window.setTimeout(pullBack, 140);
  };

  useEffect(() => {
    if (!pageOpen) {
      setHover(-1);
      pullBack();
    }
  }, [pageOpen]);
  useEffect(() => {
    if (!open && cam.current) gsap.set(cam.current, { scale: 1, x: 0, y: 0 });
  }, [open]);
  useEffect(() => () => window.clearTimeout(leaveT.current), []);

  const t = frames[tip];

  return (
    <div
      ref={root}
      className={`wallv ${open ? "is-open" : ""}`}
      data-lenis-prevent
      aria-hidden={!open}
      style={{ background: wall.bg, ["--wa" as string]: wall.aspect }}
    >
      <div className="wallv__cam" ref={cam}>
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
              zoomTo(i);
            }}
            onPointerLeave={leave}
            onFocus={() => {
              setHover(i);
              setTip(i);
              zoomTo(i);
            }}
            onBlur={leave}
            tabIndex={open ? 0 : -1}
            aria-label={`${items[i].title}, ${items[i].subtitle}. View project ${i + 1}`}
          />
        ))}
      </div>
      </div>

        <span
          className={`wallv__chip ${hover >= 0 ? "is-on" : ""}`}
          style={{ left: `${t.x + t.w / 2}%`, top: `${t.y + t.h}%` }}
          aria-hidden="true"
        >
          {pad(tip + 1)} · {items[tip].title} · View ↗
        </span>

      <ProjectPage
        index={page}
        open={pageOpen}
        origin={origin}
        onClose={() => {
          pageRef.current = false;
          setPageOpen(false);
        }}
        onGo={(i) => {
          setOrigin(null);
          setPage(i);
        }}
      />

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
