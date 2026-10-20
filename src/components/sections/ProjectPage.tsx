"use client";
/* eslint-disable @next/next/no-img-element, react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { works } from "@/data/work";
import { details, fallback } from "@/data/workdetail";
import { cafe } from "@/lib/audio";

export type Origin = { x: number; y: number; w: number; h: number } | null;

const pad = (n: number) => String(n).padStart(2, "0");
const fit = (t: string) => Math.max(8, Math.min(20, 84 / (0.6 * t.length)));
const ok = (u?: string) => !!u && /^https?:\/\//i.test(u.trim());
const CHAPTERS = [
  { label: "Overview", sel: ".pg__hero" },
  { label: "Facts", sel: ".pg__facts" },
  { label: "Story", sel: ".pg__story" },
  { label: "Images", sel: ".pg__gallery" },
];
const calm = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = {
  index: number;
  open: boolean;
  origin: Origin;
  onClose: () => void;
  onGo: (i: number) => void;
};

export default function ProjectPage({ index, open, origin, onClose, onGo }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);
  const [lb, setLb] = useState(-1);
  const [past, setPast] = useState(false);
  const [ch, setCh] = useState(0);
  const [zoom, setZoom] = useState(false);
  const touch = useRef(0);
  const tag = useRef<HTMLDivElement>(null);

  const n = works.length;
  const w = works[Math.max(0, index)] ?? works[0];
  const d = details[w.slug] ?? fallback;
  const shots = d.gallery;
  const prev = (index - 1 + n) % n;
  const next = (index + 1) % n;

  const go = (i: number) => {
    setLb(-1);
    cafe.play("page");
    onGo(i);
  };

  const jump = (sel: string) => {
    const sc = scroller.current;
    const t = sc?.querySelector(sel) as HTMLElement | null;
    if (!sc || !t) return;
    const top = t.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 84;
    sc.scrollTo({ top: Math.max(0, top), behavior: calm() ? "auto" : "smooth" });
    cafe.play("tick");
  };

  /* open: the poster grows to fill the screen. close: it shrinks back into its frame. */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const box = () => {
      const W = el.clientWidth;
      const H = el.clientHeight;
      const o = origin;
      return o
        ? `inset(${o.y}px ${W - o.x - o.w}px ${H - o.y - o.h}px ${o.x}px)`
        : "inset(50% 50% 50% 50%)";
    };
    if (open) {
      wasOpen.current = true;
      gsap.killTweensOf(el);
      cafe.play("page");
      if (calm()) {
        gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      } else {
        gsap.fromTo(
          el,
          { autoAlpha: 1, clipPath: box() },
          { clipPath: "inset(0px 0px 0px 0px)", duration: 1.1, ease: "power3.inOut", clearProps: "clipPath" }
        );
      }
      const t = window.setTimeout(() => {
        (el.querySelector(".pgv__btn") as HTMLElement | null)?.focus({ preventScroll: true });
      }, 900);
      return () => window.clearTimeout(t);
    } else if (wasOpen.current) {
      wasOpen.current = false;
      setLb(-1);
      gsap.killTweensOf(el);
      if (calm()) {
        gsap.to(el, { autoAlpha: 0, duration: 0.3 });
      } else {
        gsap.to(el, {
          clipPath: box(),
          duration: 0.8,
          ease: "power3.inOut",
          onComplete: () => {
            gsap.set(el, { autoAlpha: 0, clearProps: "clipPath" });
          },
        });
      }
    }
  }, [open]);

  /* the content rises in when the page opens or the project changes */
  useEffect(() => {
    const el = root.current;
    if (!el || !open) return;
    scroller.current?.scrollTo({ top: 0 });
    if (calm()) return;
    const t = gsap.fromTo(
      el.querySelectorAll("[data-r]"),
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out", stagger: 0.09, delay: origin ? 0.75 : 0.1, clearProps: "transform,opacity" }
    );
    return () => {
      t.kill();
    };
  }, [open, index]);

  /* gallery pieces fade up as you reach them, and the top line shows progress */
  useEffect(() => {
    const sc = scroller.current;
    if (!sc || !open) return;
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && e.target.classList.add("is-in")),
      { root: sc, threshold: 0.12 }
    );
    sc.querySelectorAll(".rv").forEach((node) => {
      node.classList.remove("is-in");
      io.observe(node);
    });
    const onScroll = () => {
      const max = sc.scrollHeight - sc.clientHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? sc.scrollTop / max : 0})`;
      setPast(sc.scrollTop > sc.clientHeight * 0.45);
      const base = sc.getBoundingClientRect().top;
      let cur = 0;
      CHAPTERS.forEach((c, i) => {
        const node = sc.querySelector(c.sel);
        if (node && node.getBoundingClientRect().top - base < 160) cur = i;
      });
      setCh(cur);
    };
    sc.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      io.disconnect();
      sc.removeEventListener("scroll", onScroll);
    };
  }, [open, index]);

  /* the mockup leans toward the pointer, buttons pull toward it, a tag follows the cursor over images */
  useEffect(() => {
    const el = root.current;
    const sc = scroller.current;
    if (!el || !sc || !open) return;
    if (!window.matchMedia("(pointer: fine)").matches || calm()) return;
    const mock = sc.querySelector(".pg__mock") as HTMLElement | null;
    const hero = sc.querySelector(".pg__hero") as HTMLElement | null;
    const tg = tag.current;
    const tx = tg ? gsap.quickTo(tg, "x", { duration: 0.35, ease: "power3" }) : null;
    const ty = tg ? gsap.quickTo(tg, "y", { duration: 0.35, ease: "power3" }) : null;
    let tilted = false;
    const level = () => {
      if (mock && tilted) {
        tilted = false;
        gsap.to(mock, { rotationX: 0, rotationY: 0, x: 0, duration: 0.9, ease: "power3.out", overwrite: "auto" });
      }
    };
    const move = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      if (mock && hero && hero.contains(t)) {
        const r = hero.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        tilted = true;
        gsap.to(mock, {
          transformPerspective: 900,
          rotationY: nx * 9,
          rotationX: -ny * 5,
          x: nx * 14,
          duration: 0.8,
          ease: "power3.out",
          overwrite: "auto",
        });
      } else {
        level();
      }
      el.querySelectorAll<HTMLElement>(".pg__cta").forEach((b) => {
        const r = b.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 90) {
          b.dataset.pull = "1";
          gsap.to(b, { x: dx * 0.22, y: dy * 0.22, duration: 0.3, ease: "power3.out", overwrite: "auto" });
        } else if (b.dataset.pull === "1") {
          b.dataset.pull = "0";
          gsap.to(b, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.5)", overwrite: "auto" });
        }
      });
      if (tg) {
        tg.classList.toggle("is-on", !!t.closest(".pg__shot button"));
        const pr = el.getBoundingClientRect();
        tx?.(e.clientX - pr.left);
        ty?.(e.clientY - pr.top);
      }
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", level);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", level);
      tg?.classList.remove("is-on");
    };
  }, [open, index]);

  /* left and right arrows switch project while no image is open */
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (lb >= 0) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(next);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(prev);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open, lb, index]);

  /* a soft tick when an image opens or changes, and the zoom resets */
  useEffect(() => {
    setZoom(false);
    if (lb >= 0) cafe.play("tick");
  }, [lb]);

  /* while the viewer is open it takes the keys first, so Esc closes only the viewer */
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (lb < 0) return;
      e.stopImmediatePropagation();
      if (e.key === "Escape") {
        if (zoom) setZoom(false);
        else setLb(-1);
      }
      else if (e.key === "ArrowRight") setLb((v) => (v + 1) % shots.length);
      else if (e.key === "ArrowLeft") setLb((v) => (v - 1 + shots.length) % shots.length);
    };
    window.addEventListener("keydown", key, true);
    return () => window.removeEventListener("keydown", key, true);
  }, [open, lb, shots.length, zoom]);

  return (
    <div
      ref={root}
      className={`pgv ${open ? "is-open" : ""}`}
      aria-hidden={!open}
      style={{ ["--c1" as string]: w.colors[0], ["--c2" as string]: w.colors[1], ["--fs" as string]: fit(w.title) }}
    >
      <div className="pgv__prog">
        <i ref={bar} />
      </div>

      <div className="pgv__bar">
        <button className="pgv__btn" onClick={onClose} tabIndex={open ? 0 : -1}>
          <ArrowLeft size={16} /> Back to the wall
        </button>
        <span className={`pgv__name ${past ? "is-on" : ""}`}>{w.title}</span>
        <span className="pgv__count">
          {pad(index + 1)} / {pad(n)}
        </span>
        <span className="pgv__pn">
          <button onClick={() => go(prev)} aria-label="Previous project" tabIndex={open ? 0 : -1}>
            <ArrowLeft size={16} />
          </button>
          <button onClick={() => go(next)} aria-label="Next project" tabIndex={open ? 0 : -1}>
            <ArrowRight size={16} />
          </button>
        </span>
      </div>

      <nav className="pgv__ch" aria-label="Sections">
        {CHAPTERS.filter((c) => c.sel !== ".pg__gallery" || shots.length > 0).map((c, i) => (
          <button key={c.label} className={ch === i ? "is-on" : ""} onClick={() => jump(c.sel)} tabIndex={open ? 0 : -1}>
            <span>{c.label}</span>
            <i />
          </button>
        ))}
      </nav>

      <div className="pgv__scroll" ref={scroller} data-lenis-prevent>
        <article className="pg" key={w.slug}>
          <section className="pg__hero">
            <h2 className="pg__title" data-r>
              {w.title}
            </h2>
            <span className="pg__sw" data-r>
              <i />
              <i />
            </span>
            <div className="pg__side" data-r>
              <p className="pg__sub">{w.subtitle}</p>
              <div className="pg__links">
                {ok(w.live) && (
                  <a className="pg__cta" href={w.live} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                    View website <ArrowUpRight size={18} />
                  </a>
                )}
                {ok(w.figma) && (
                  <a className="pg__cta pg__cta--ghost" href={w.figma} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1}>
                    View in Figma <ArrowUpRight size={18} />
                  </a>
                )}
                {!ok(w.live) && !ok(w.figma) && <span className="pg__soon">Links coming soon</span>}
              </div>
            </div>
            <div className="pg__mock" data-r>
              {w.mockup && <img src={w.mockup} alt={`${w.title} mockup`} draggable={false} />}
              <span className="pg__ground" />
            </div>
          </section>

          <dl className="pg__facts rv">
            <div>
              <dt>Role</dt>
              <dd>{d.role}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{d.year}</dd>
            </div>
            <div>
              <dt>Duration</dt>
              <dd>{d.duration}</dd>
            </div>
            <div>
              <dt>Client</dt>
              <dd>{d.client}</dd>
            </div>
            <div className="pg__stack">
              <dt>Stack</dt>
              <dd>
                <ul>
                  {d.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <section className="pg__story">
            {[
              ["01", "The brief", d.brief],
              ["02", "The approach", d.approach],
              ["03", "The result", d.result],
            ].map(([num, title, text]) => (
              <div key={num} className="rv">
                <span className="pg__num">{num}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </section>

          {shots.length > 0 && (
            <section className="pg__gallery" aria-label="Project images">
              {shots.map((s, i) => (
                <figure key={s.src} className={`pg__shot rv ${s.size === "full" ? "is-full" : ""}`}>
                  <button onClick={() => setLb(i)} tabIndex={open ? 0 : -1} aria-label={`View image: ${s.caption}`}>
                    <img src={s.src} alt={s.caption} loading="lazy" draggable={false} />
                  </button>
                  <figcaption>
                    {pad(i + 1)} · {s.caption}
                  </figcaption>
                </figure>
              ))}
            </section>
          )}

          <button
            className="pg__next rv"
            style={{ ["--n1" as string]: works[next].colors[0] }}
            onClick={() => go(next)}
            tabIndex={open ? 0 : -1}
          >
            <small>Next project</small>
            <span>{works[next].title}</span>
            <ArrowRight size={40} />
          </button>
        </article>
      </div>

      <button
        className={`pgv__top ${past ? "is-on" : ""}`}
        onClick={() => scroller.current?.scrollTo({ top: 0, behavior: calm() ? "auto" : "smooth" })}
        tabIndex={open && past ? 0 : -1}
      >
        <ArrowUp size={16} /> Top
      </button>

      <div className="pgv__tag" ref={tag} aria-hidden="true">
        Enlarge
      </div>

      <div
        className={`pgv__lb ${lb >= 0 ? "is-on" : ""} ${zoom ? "is-zoom" : ""}`}
        onClick={() => setLb(-1)}
        onTouchStart={(e) => {
          touch.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 60 && !zoom) setLb((v) => (v + (dx < 0 ? 1 : -1) + shots.length) % shots.length);
        }}
        role="dialog"
        aria-label="Image viewer"
      >
        {lb >= 0 && shots[lb] && (
          <>
            <img
              className="pgv__lbimg"
              src={shots[lb].src}
              alt={shots[lb].caption}
              draggable={false}
              onClick={(e) => {
                e.stopPropagation();
                setZoom((z) => !z);
              }}
              onPointerMove={(e) => {
                if (!zoom) return;
                const box = e.currentTarget.parentElement!.getBoundingClientRect();
                const x = ((e.clientX - box.left) / box.width) * 100;
                const y = ((e.clientY - box.top) / box.height) * 100;
                e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
              }}
            />
            <p onClick={(e) => e.stopPropagation()}>
              {pad(lb + 1)} / {pad(shots.length)} · {shots[lb].caption}
              <em>{zoom ? "Move to pan · click to zoom out" : "Click to zoom · arrow keys to browse"}</em>
            </p>
            <div className="pgv__thumbs" onClick={(e) => e.stopPropagation()}>
              {shots.map((t, i) => (
                <button
                  key={t.src}
                  className={i === lb ? "is-on" : ""}
                  onClick={() => setLb(i)}
                  aria-label={`Image ${i + 1}: ${t.caption}`}
                >
                  <img src={t.src} alt="" draggable={false} />
                </button>
              ))}
            </div>
            <button className="pgv__lbx" onClick={() => setLb(-1)} aria-label="Close viewer">
              <X size={20} />
            </button>
            <button
              className="pgv__lbn is-prev"
              onClick={(e) => {
                e.stopPropagation();
                setLb((v) => (v - 1 + shots.length) % shots.length);
              }}
              aria-label="Previous image"
            >
              <ArrowLeft size={22} />
            </button>
            <button
              className="pgv__lbn is-next"
              onClick={(e) => {
                e.stopPropagation();
                setLb((v) => (v + 1) % shots.length);
              }}
              aria-label="Next image"
            >
              <ArrowRight size={22} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
