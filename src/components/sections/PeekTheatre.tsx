"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ArrowUpRight, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import PeekLook from "./PeekLook";
import { works } from "@/data/work";
import { details } from "@/data/workdetail";

type Box = { top: number; left: number; width: number; height: number };
type Loose = {
  role?: string;
  year?: string;
  duration?: string;
  client?: string;
  stack?: string[];
  brief?: string;
  approach?: string;
  result?: string;
  gallery?: { src: string; caption?: string }[];
};

const ok = (u?: string) => !!u && /^https?:\/\//i.test(u.trim());
const host = (u: string) => u.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
const CLIENT_LINKS: Record<string, string> = {
  "tzaneen-taxi": "https://www.thingsdesign.co.za/",
  "the-wellness-app": "https://www.thingsdesign.co.za/",
};

const paras = (t?: string) =>
  (t ?? "")
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);

export default function PeekTheatre({
  slug,
  from,
  onClose,
}: {
  slug: string;
  from: Box;
  onClose: () => void;
}) {
  const w = works.find((x) => x.slug === slug);
  const d = (details as unknown as Record<string, Loose | undefined>)[slug];

  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tilt = useRef<HTMLDivElement>(null);
  const xBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);
  const reduced = useRef(false);
  const [idx, setIdx] = useState(0);
  const [bad, setBad] = useState<string[]>([]);
  const [look, setLook] = useState<Box | null>(null);
  const lookOpen = useRef(false);
  lookOpen.current = !!look;
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  const shots = (d?.gallery ?? []).filter((g) => !bad.includes(g.src));
  const cur = shots.length ? idx % shots.length : 0;

  /* the card's rectangle, expressed as an inset of the big panel */
  const clipFrom = () => {
    const r = panel.current!.getBoundingClientRect();
    const t = Math.max(0, from.top - r.top);
    const l = Math.max(0, from.left - r.left);
    const rr = Math.max(0, r.right - (from.left + from.width));
    const b = Math.max(0, r.bottom - (from.top + from.height));
    return `inset(${t}px ${rr}px ${b}px ${l}px round 10px)`;
  };

  /* unroll from the card into the big panel */
  useLayoutEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".peekx__veil", { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" });
      gsap.fromTo(
        panel.current,
        { clipPath: clipFrom() },
        { clipPath: "inset(0px 0px 0px 0px round 18px)", duration: 0.9, ease: "power3.inOut" }
      );
      gsap.fromTo(
        ".peekx__in",
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.07, delay: 0.5, ease: "power2.out" }
      );
    }, root);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (reduced.current || !root.current || !panel.current) {
      onClose();
      return;
    }
    const q = (s: string) => root.current!.querySelectorAll(s);
    gsap
      .timeline({ onComplete: onClose })
      .to(q(".peekx__in"), { opacity: 0, y: 10, duration: 0.22, stagger: 0.015 }, 0)
      .to(panel.current, { clipPath: clipFrom(), duration: 0.65, ease: "power3.inOut" }, 0.12)
      .to(q(".peekx__veil"), { opacity: 0, duration: 0.5 }, 0.25);
  };

  const closeRef = useRef(close);
  closeRef.current = close;
  const stepRef = useRef((n: number) => {
    void n;
  });
  stepRef.current = (n: number) => {
    if (shots.length) setIdx((cur + n + shots.length) % shots.length);
  };

  /* keys, and keep the page behind it still */
  useEffect(() => {
    xBtn.current?.focus({ preventScroll: true });

    const key = (e: KeyboardEvent) => {
      if (lookOpen.current) return;
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
        if (tag !== "BUTTON" && tag !== "A") {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    };
    window.addEventListener("keydown", key, true);

    const el = root.current!;
    const stop = (e: Event) => {
      const mobile = window.matchMedia("(max-width: 860px)").matches;
      const keep = (e.target as HTMLElement).closest?.(mobile ? ".peekx__panel" : ".peekx__scroll");
      if (!keep) e.preventDefault();
    };
    el.addEventListener("wheel", stop, { passive: false });
    el.addEventListener("touchmove", stop, { passive: false });

    return () => {
      window.removeEventListener("keydown", key, true);
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
    };
  }, []);

  /* the screens keep looping */
  useEffect(() => {
    if (look || shots.length < 2 || reduced.current) return;
    const t = window.setTimeout(() => setIdx((cur + 1) % shots.length), 3400);
    return () => window.clearTimeout(t);
  }, [cur, shots.length, look]);

  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced.current || !tilt.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(tilt.current, { rotateX: -y * 5, rotateY: x * 7, duration: 0.6, ease: "power2.out" });
  };
  const rest = () => {
    if (tilt.current) gsap.to(tilt.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "power3.out" });
  };

  if (!w || !d) return null;

  const live = ok(w.live);
  const facts = [
    ["Role", d.role],
    ["Year", d.year],
    ["Duration", d.duration],
    [CLIENT_LINKS[slug] ? "Built at" : "Client", d.client],
  ].filter(([, v]) => v) as [string, string][];
  const secs: [string, string | undefined][] = [
    ["The brief", d.brief],
    ["How I built it", d.approach],
    ["The result", d.result],
  ];

  return (
    <div
      ref={root}
      className="peekx"
      data-lenis-prevent
      role="dialog"
      aria-modal="true"
      aria-label={`${w.title} preview`}
      style={{ ["--c1" as string]: w.colors[0], ["--c2" as string]: w.colors[1] }}
    >
      <div className="peekx__veil" onClick={close} />

      {look && shots.length > 0 && (
        <PeekLook
          shots={shots}
          index={cur}
          onIndex={setIdx}
          from={look}
          color={w.colors[1]}
          onClose={() => setLook(null)}
        />
      )}

      <div ref={panel} className="peekx__panel">
        <button ref={xBtn} className="peekx__x" onClick={close} aria-label="Close">
          <X size={20} />
        </button>

        <div className="peekx__stage" onMouseMove={move} onMouseLeave={rest}>
          <div ref={tilt} className="peekx__tilt">
            <div className="peekx__bar">
              <i />
              <i />
              <i />
              <span>{live ? host(w.live as string) : "coming soon"}</span>
              {live && (
                <em>
                  <b /> LIVE
                </em>
              )}
            </div>
            <div
              className="peekx__screen"
              role="button"
              tabIndex={0}
              aria-label="Look closer"
              onPointerDown={(e) => {
                swipe.current = { x: e.clientX, y: e.clientY };
                swiped.current = false;
              }}
              onPointerUp={(e) => {
                const s0 = swipe.current;
                swipe.current = null;
                if (!s0 || e.pointerType === "mouse") return;
                const dx = e.clientX - s0.x;
                const dy = e.clientY - s0.y;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.4) {
                  swiped.current = true;
                  stepRef.current(dx < 0 ? 1 : -1);
                }
              }}
              onClick={(e) => {
                if (swiped.current) {
                  swiped.current = false;
                  return;
                }
                if (shots.length > 0) setLook(e.currentTarget.getBoundingClientRect());
              }}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && shots.length > 0) {
                  e.preventDefault();
                  setLook(e.currentTarget.getBoundingClientRect());
                }
              }}
            >
              {shots.length === 0 && <div className="peekx__fallback">{w.title}</div>}
              {shots[cur] && (
                <span className="peekx__blur" style={{ backgroundImage: `url("${shots[cur].src}")` }} />
              )}
              {shots.map((g, i) => (
                <img
                  key={g.src}
                  className={`peekx__img ${i === cur ? "is-on" : ""}`}
                  src={g.src}
                  alt={g.caption ?? `${w.title} screen ${i + 1}`}
                  onError={() => setBad((b) => (b.includes(g.src) ? b : [...b, g.src]))}
                />
              ))}
              {shots.length > 1 && <span key={cur} className="peekx__sweep" />}
              {shots.length > 0 && (
                <span className="peekx__lookhint">
                  <ZoomIn size={13} /> Click to look closer
                </span>
              )}
            </div>
            {shots.length > 1 && (
              <div className="peekx__prog">
                <i key={cur} />
              </div>
            )}
          </div>

          {shots.length > 0 && (
            <div className="peekx__cap peekx__in">
              <button onClick={() => stepRef.current(-1)} aria-label="Previous screen">
                <ChevronLeft size={18} />
              </button>
              <p>{shots[cur]?.caption ?? w.subtitle}</p>
              <button onClick={() => stepRef.current(1)} aria-label="Next screen">
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {shots.length > 1 && (
            <div className="peekx__thumbs peekx__in">
              {shots.map((g, i) => (
                <button
                  key={g.src}
                  className={`peekx__th ${i === cur ? "is-on" : ""}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Screen ${i + 1}`}
                >
                  <img src={g.src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="peekx__scroll">
          <p className="peekx__tag peekx__in">{w.subtitle}</p>
          <h2 className="peekx__title peekx__in">{w.title}</h2>

          {facts.length > 0 && (
            <dl className="peekx__facts peekx__in">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>
                    {k === "Built at" && CLIENT_LINKS[slug] ? (
                      <a href={CLIENT_LINKS[slug]} target="_blank" rel="noopener noreferrer" className="peekx__link">
                        {v} <ArrowUpRight size={13} />
                      </a>
                    ) : (
                      v
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <div className="peekx__cta peekx__in">
            {live ? (
              <a
                className="pcard__cta peek__live"
                href={(w.live as string).trim()}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="peek__pulse" /> Visit live site <ArrowUpRight size={18} />
              </a>
            ) : (
              <p className="peek__soon">Not live yet. The full case study is inside the studio.</p>
            )}
          </div>

          {secs.map(([h, t], i) =>
            t ? (
              <section key={h} className="peekx__sec peekx__in">
                <h4>
                  <b>{String(i + 1).padStart(2, "0")}</b> {h}
                </h4>
                {paras(t).map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </section>
            ) : null
          )}

          {d.stack && d.stack.length > 0 && (
            <ul className="peekx__stack peekx__in">
              {d.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
