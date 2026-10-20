"use client";
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { archive } from "@/data/archive";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Archive({ open, onClose }: { open: boolean; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const [sel, setSel] = useState(0);
  const item = archive[sel];

  /* the crate rises over the wall, the sleeves drop in one after another */
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (open) {
      wasOpen.current = true;
      gsap.killTweensOf(el);
      if (reduce) {
        gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
      } else {
        gsap.fromTo(
          el,
          { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "power3.inOut", clearProps: "clipPath" }
        );
        gsap.fromTo(
          el.querySelectorAll(".sleeve"),
          { y: 70, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.06, delay: 0.5, clearProps: "transform,opacity" }
        );
      }
    } else if (wasOpen.current) {
      wasOpen.current = false;
      gsap.killTweensOf(el);
      if (reduce) {
        gsap.to(el, { autoAlpha: 0, duration: 0.3 });
      } else {
        gsap.to(el, {
          clipPath: "inset(100% 0% 0% 0%)",
          duration: 0.6,
          ease: "power3.inOut",
          onComplete: () => {
            gsap.set(el, { autoAlpha: 0, clearProps: "clipPath" });
          },
        });
      }
    }
  }, [open]);

  /* arrow keys move between sleeves */
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        setSel((v) => (v + 1) % archive.length);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        setSel((v) => (v - 1 + archive.length) % archive.length);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  /* keep the chosen sleeve in view */
  useEffect(() => {
    if (!open) return;
    const s = root.current?.querySelectorAll(".sleeve")[sel] as HTMLElement | undefined;
    s?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [sel, open]);

  return (
    <div ref={root} className={`archive ${open ? "is-open" : ""}`} aria-hidden={!open}>
      <div className="archive__inner" data-lenis-prevent>
        <div className="archive__side">
          <span className="archive__count">{archive.length} projects in the crate</span>
          <h2 className="archive__title">Archive</h2>

          <article className="adetail" key={item.slug}>
            <span className="adetail__kicker">
              {pad(sel + 1)} / {pad(archive.length)}
            </span>
            <h3>{item.title}</h3>
            <ul className="atags">
              <li>{item.kind}</li>
              <li>{item.year}</li>
            </ul>
            <p>{item.blurb}</p>
            <ul className="atags">
              {item.stack.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
            <div className="alinks">
              {item.live && (
                <a className="pcard__cta" href={item.live} target="_blank" rel="noopener noreferrer">
                  Live site <ArrowUpRight size={18} />
                </a>
              )}
              {item.figma && (
                <a className="pcard__cta pcard__cta--ghost" href={item.figma} target="_blank" rel="noopener noreferrer">
                  Figma <ArrowUpRight size={18} />
                </a>
              )}
              {!item.live && !item.figma && <span className="alinks__soon">Links coming soon</span>}
            </div>
          </article>
        </div>

        <div className="archive__grid">
          {archive.map((a, i) => (
            <button
              key={a.slug}
              className={`sleeve ${sel === i ? "is-sel" : ""}`}
              style={{ ["--c1" as string]: a.colors[0], ["--c2" as string]: a.colors[1] }}
              onClick={() => setSel(i)}
              tabIndex={open ? 0 : -1}
              aria-pressed={sel === i}
              aria-label={`${a.title}, ${a.kind}, ${a.year}`}
            >
              <span className="sleeve__art">
                <span className="sleeve__disc" />
                <span className="sleeve__cover">
                  {a.cover ? <img src={a.cover} alt="" loading="lazy" draggable={false} /> : <b>{pad(i + 1)}</b>}
                </span>
              </span>
              <span className="sleeve__cap">
                <strong>{a.title}</strong>
                <small>
                  {a.kind} · {a.year}
                </small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <button className="wallv__back" onClick={onClose} tabIndex={open ? 0 : -1}>
        <ArrowLeft size={16} /> Back to the wall
      </button>
    </div>
  );
}
