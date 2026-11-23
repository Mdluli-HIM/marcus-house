"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Maximize2 } from "lucide-react";
import { works } from "@/data/work";
import { details } from "@/data/workdetail";

const ok = (u?: string) => !!u && /^https?:\/\//i.test(u.trim());
const host = (u: string) => u.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");

type Loose = Record<string, { gallery?: { src: string }[] } | undefined>;

function lookup(slug: string) {
  const w = works.find((x) => x.slug === slug);
  const d = (details as unknown as Loose)[slug];
  if (!w || !d) return null;
  const shots = (d.gallery ?? []).map((g) => g.src);
  return { w, shots: shots.length ? shots : w.mockup ? [w.mockup] : [] };
}

/* the little browser window with the looping screens */
type Box = { top: number; left: number; width: number; height: number };

export function PeekVisual({
  slug,
  on,
  onOpen,
}: {
  slug: string;
  on: boolean;
  onOpen?: (from: Box) => void;
}) {
  const found = lookup(slug);
  const [idx, setIdx] = useState(0);
  const [bad, setBad] = useState<string[]>([]);

  const slides = found ? found.shots.filter((s) => !bad.includes(s)) : [];

  useEffect(() => {
    if (!on || slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setIdx((i) => (i + 1) % slides.length), 2600);
    return () => window.clearInterval(t);
  }, [on, slides.length]);

  if (!found) return null;
  const { w } = found;
  const live = ok(w.live);
  const cur = slides.length ? idx % slides.length : 0;

  return (
    <div
      className="peek"
      style={{ ["--c1" as string]: w.colors[0], ["--c2" as string]: w.colors[1] }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${w.title} bigger`}
      onClick={(e) => onOpen?.(e.currentTarget.getBoundingClientRect())}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(e.currentTarget.getBoundingClientRect());
        }
      }}
    >
      <div className="peek__bar">
        <i />
        <i />
        <i />
        <span>{live ? host(w.live as string) : "coming soon"}</span>
        {live && (
          <em>
            <b /> LIVE
          </em>
        )}
        <Maximize2 className="peek__max" size={12} />
      </div>
      <div className="peek__screen">
        {slides.length === 0 && <div className="peek__fallback">{w.title}</div>}
        {slides[cur] && (
          <span className="peek__blur" style={{ backgroundImage: `url("${slides[cur]}")` }} />
        )}
        <span className="peek__open">Click to open</span>
        {slides.map((src, i) => (
          <img
            key={src}
            className={`peek__img ${i === cur ? "is-on" : ""}`}
            src={src}
            alt=""
            loading="lazy"
            onError={() => setBad((b) => (b.includes(src) ? b : [...b, src]))}
          />
        ))}
        {slides.length > 1 && <span key={cur} className="peek__sweep" />}
      </div>
      {slides.length > 1 && (
        <div className="peek__ticks">
          {slides.map((_, i) => (
            <b key={i} className={i === cur ? "is-on" : ""} />
          ))}
        </div>
      )}
    </div>
  );
}

/* the live-site button, or an honest note when there isn't one yet */
export function PeekLink({ slug }: { slug: string }) {
  const found = lookup(slug);
  if (!found) return null;
  const { w } = found;
  if (ok(w.live)) {
    return (
      <a
        className="pcard__cta peek__live"
        href={(w.live as string).trim()}
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="peek__pulse" /> Visit live site <ArrowUpRight size={18} />
      </a>
    );
  }
  return <p className="peek__soon">Not live yet. The case study is inside the studio.</p>;
}
