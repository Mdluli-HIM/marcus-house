"use client";
import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cafe } from "@/lib/audio";
import { getLenis } from "@/lib/lenis";
import { profile } from "@/data/profile";

/* heavy images to warm up while the visitor reads the screen */
const PRELOAD = ["/images/world.png", "/images/interior.png"];
const SLATS = 20;

export default function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const leaving = useRef(false);
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [gone, setGone] = useState(false);

  /* lock the page and load */
  useEffect(() => {
    if (document.documentElement.classList.contains("skip-intro")) {
      cafe.resumeOnGesture();
      setGone(true);
      return;
    }
    document.documentElement.classList.add("intro-lock");
    let dead = false;
    let done = 0;
    const total = PRELOAD.length + 1;
    const tick = () => {
      if (dead) return;
      done += 1;
      setPct(Math.min(100, Math.round((done / total) * 100)));
      if (done >= total) setReady(true);
    };
    PRELOAD.forEach((src) => {
      const im = new window.Image();
      im.onload = tick;
      im.onerror = tick;
      im.src = src;
    });
    document.fonts.ready.then(tick, tick);
    /* never trap anyone on a slow connection */
    const cap = window.setTimeout(() => {
      if (dead) return;
      setPct(100);
      setReady(true);
    }, 9000);
    return () => {
      dead = true;
      window.clearTimeout(cap);
      document.documentElement.classList.remove("intro-lock");
    };
  }, []);

  /* the choices appear when everything is ready */
  useEffect(() => {
    if (!ready) return;
    const el = root.current;
    if (!el) return;
    gsap.fromTo(
      el.querySelectorAll(".intro__choose > *"),
      { y: 16, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.1, ease: "power3.out" }
    );
    (el.querySelector(".intro__primary") as HTMLElement | null)?.focus({ preventScroll: true });
  }, [ready]);

  /* the shop opens */
  const enter = (withSound: boolean) => {
    if (leaving.current) return;
    leaving.current = true;
    try {
      sessionStorage.setItem("marcus:seen", "1");
      if (!withSound) sessionStorage.setItem("marcus:sound", "0");
    } catch {}
    /* this runs inside the click, which is what allows audio to start */
    if (withSound && !cafe.enabled) cafe.toggle();
    window.dispatchEvent(new Event("marcus:sound"));

    const el = root.current;
    if (!el) return;
    const finish = () => {
      document.documentElement.classList.remove("intro-lock");
      getLenis()?.start();
      setGone(true);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.dispatchEvent(new Event("marcus:open"));
      gsap.to(el, { autoAlpha: 0, duration: 0.3, onComplete: finish });
      return;
    }

    const q = (s: string) => el.querySelector(s) as HTMLElement;
    el.classList.add("is-opening");
    const tl = gsap.timeline({ onComplete: finish });
    tl.add(() => cafe.play("page"), 0.05);
    tl.to(q(".intro__flip"), { rotateY: 180, duration: 0.95, ease: "power3.inOut" }, 0);
    tl.add(() => {
      window.dispatchEvent(new Event("marcus:open"));
      cafe.play("shutter");
    }, 1.5);
    tl.to(q(".intro__shutter"), { yPercent: -102, duration: 2.4, ease: "power1.inOut" }, 1.5);
    tl.to(
      q(".intro__shutter"),
      { x: "random(-2.5, 2.5)", duration: 0.06, repeat: 38, yoyo: true, repeatRefresh: true, ease: "none" },
      1.5
    );
    tl.add(() => cafe.play("gull"), 3.2);
    tl.add(() => cafe.play("bell"), 3.7);
  };

  if (gone) return null;

  return (
    <div ref={root} className="intro" role="dialog" aria-modal="true" aria-label="Welcome">
      <div className="intro__shutter">
        <div className="intro__slats" aria-hidden="true">
          {Array.from({ length: SLATS }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <span className="intro__spray" aria-hidden="true">
          back in a moment
        </span>

        <div className="intro__sign">
          <div className="intro__flip">
            <div className="intro__face intro__front">
              <span className="intro__stamp">Closed</span>
              <span className="intro__logo" aria-hidden="true">
                MM
              </span>
              <p className="intro__name">{profile.name}</p>
              <p className="intro__role">{profile.title}</p>
              <p className="intro__badge">
                <i /> {profile.availability}
              </p>

              <div className="intro__load" aria-live="polite">
                <span className="intro__bar">
                  <i style={{ transform: `scaleX(${pct / 100})` }} />
                </span>
                <span className="intro__pct">{ready ? "Ready" : `Loading ${pct}%`}</span>
              </div>

              <div className="intro__choose">
                <button className="intro__primary" onClick={() => enter(true)} tabIndex={ready ? 0 : -1}>
                  <Volume2 size={18} /> Enter with sound
                </button>
                <button className="intro__ghost" onClick={() => enter(false)} tabIndex={ready ? 0 : -1}>
                  <VolumeX size={18} /> Enter without sound
                </button>
                <small>Best with sound on. You can change it any time.</small>
              </div>
            </div>

            <div className="intro__face intro__back" aria-hidden="true">
              <span className="intro__open">Open</span>
              <span className="intro__come">Come on in</span>
            </div>
          </div>
        </div>

        <span className="intro__handle" aria-hidden="true" />
      </div>
    </div>
  );
}
