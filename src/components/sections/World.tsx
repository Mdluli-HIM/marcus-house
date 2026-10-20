"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, DoorOpen } from "lucide-react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import Inside from "@/components/sections/Inside";

const WORLD_SRC = "/images/world.png";
const VB_W = 1672;
const VB_H = 941;

/* the green door on the shopfront, in % of the image. Nudge these to fit. */
const DOOR = { x: 45.2, y: 53.2, w: 7.7, h: 28.2 };

/* timeline units. 1 unit = PX_PER_UNIT viewport heights of scrolling */
const TOUR_START = 1.0;
const STEP = 3.0; // time per project
const SETTLE = 1.4; // the camera has arrived this long after a step starts
const PX_PER_UNIT = 0.5;
const SNAP = true; // the scroll settles on each project. Set false for free scrolling.
const n = projects.length;
const END = TOUR_START + n * STEP;
const DOOR_AT = END + SETTLE; // the camera is at the door

const stepOf = (t: number) => {
  if (t < TOUR_START + 0.5) return -1;
  if (t >= END + 0.3) return -1;
  return Math.min(n - 1, Math.floor((t - TOUR_START - 0.5) / STEP));
};

const pt = (i: number) => ({
  x: (projects[i].spot.x / 100) * VB_W,
  y: (projects[i].spot.y / 100) * VB_H,
});
const curve = (i: number) => {
  const a = pt(i - 1);
  const b = pt(i);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 90;
  return `M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
};

export default function World() {
  const root = useRef<HTMLElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const durRef = useRef(1);
  const reduced = useRef(false);
  const enterRef = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const atDoorRef = useRef(false);
  const phase = useRef<"outside" | "entering" | "inside">("outside");

  const [tick, setTick] = useState(0);
  const [active, setActive] = useState(-1);
  const [shown, setShown] = useState(0);
  const [inside, setInside] = useState(false);
  const [atDoor, setAtDoor] = useState(false);
  const [entering, setEntering] = useState(false);

  const setStep = useCallback((i: number) => {
    setActive(i);
    if (i >= 0) setShown(i);
  }, []);

  /* rebuild when the width changes meaningfully */
  useEffect(() => {
    let w = window.innerWidth;
    let t = 0;
    const onResize = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        if (Math.abs(window.innerWidth - w) > 60) {
          w = window.innerWidth;
          setTick((v) => v + 1);
        }
      }, 250);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(t);
    };
  }, []);

  /* cursor lantern */
  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  /* load-in animation (plays once) */
  useGSAP(
    () => {
      gsap.from(".world__stage", { opacity: 0, scale: 1.06, duration: 1.6, ease: "power3.out" });
      gsap.from(".world__intro > *", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        delay: 0.6,
        ease: "power3.out",
      });
    },
    { scope: root }
  );

  /* the scroll tour, then the door */
  useGSAP(
    () => {
      const el = root.current!;
      const q = (s: string) => el.querySelector(s) as HTMLElement;
      const mm = gsap.matchMedia(el);

      mm.add("(prefers-reduced-motion: reduce)", () => {
        reduced.current = true;
        gsap.set([".world__intro", ".guide"], { display: "none" });
        gsap.set(".net__seg", { strokeDashoffset: 0 });
        atDoorRef.current = true;
        setAtDoor(true);
        setStep(0);
        return () => {
          reduced.current = false;
        };
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        reduced.current = false;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const small = vw < 800;

        const cam = q(".world__cam");
        const stage = q(".world__stage");
        const bar = q(".guide__bar");
        gsap.set(cam, { transformOrigin: "0 0" });

        /* where the camera must go so a point sits in the free part of the screen */
        const focus = (x: number, y: number, s: number, center = false) => {
          const sw = stage.offsetWidth;
          const sh = stage.offsetHeight;
          const ox = stage.offsetLeft;
          const oy = stage.offsetTop;
          const px = ox + (x / 100) * sw;
          const py = oy + (y / 100) * sh;
          const tx = center ? vw * 0.5 : small ? vw * 0.5 : vw * 0.64;
          const ty = center ? vh * 0.5 : small ? vh * 0.36 : vh * 0.5;
          return {
            x: gsap.utils.clamp(vw - s * (ox + sw), -s * ox, tx - s * px),
            y: gsap.utils.clamp(vh - s * (oy + sh), -s * oy, ty - s * py),
            scale: s,
          };
        };

        const tl = gsap.timeline({ defaults: { ease: "none" } });
        tl.addLabel("start", 0);

        /* opening overlay fades as soon as the visitor scrolls */
        tl.to(".world__intro", { autoAlpha: 0, y: -20, duration: 0.6, ease: "power1.in" }, 0);

        /* the tour: camera walks neuron to neuron, drawing synapses */
        const S = small ? 1.5 : 1.7;
        projects.forEach((p, i) => {
          const t = TOUR_START + i * STEP;
          tl.to(cam, { ...focus(p.spot.x, p.spot.y, S), duration: SETTLE, ease: "power2.inOut" }, t);
          tl.addLabel(`p${i}`, t + SETTLE);
          if (i > 0) {
            tl.fromTo(
              `.net__seg[data-i="${i}"]`,
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: 1.2, ease: "power1.inOut" },
              t
            );
          }
        });

        /* the scroll ends in front of the door. Opening it is a separate, deliberate press. */
        const dcx = DOOR.x + DOOR.w / 2;
        const dcy = DOOR.y + DOOR.h / 2;
        tl.to(cam, { ...focus(dcx, dcy, small ? 3 : 3.6, true), duration: SETTLE, ease: "power2.inOut" }, END);
        tl.addLabel("door", DOOR_AT);
        tl.to({}, { duration: 1.4 }, DOOR_AT);

        const D = tl.duration();
        durRef.current = D;

        /* the entrance plays on its own clock, so it is always slow and gentle */
        const enter = gsap.timeline({
          paused: true,
          defaults: { ease: "none" },
          onComplete: () => {
            phase.current = "inside";
            setInside(true);
          },
          onReverseComplete: () => {
            phase.current = "outside";
            setEntering(false);
            getLenis()?.start();
          },
        });
        enter
          .fromTo(".door__light", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "sine.inOut" }, 0)
          .fromTo(".door__leaf", { rotateY: 0 }, { rotateY: 84, duration: 4, ease: "sine.inOut" }, 0.3)
          .fromTo(".door__bloom", { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: "sine.inOut" }, 3.2)
          .to(cam, { autoAlpha: 0, duration: 0.01 }, 4.6)
          .fromTo(
            ".inside",
            { autoAlpha: 0, scale: 1.12 },
            { autoAlpha: 1, scale: 1, duration: 2, ease: "sine.out" },
            4.4
          )
          .to(".door__bloom", { autoAlpha: 0, duration: 1.6, ease: "sine.inOut" }, 4.8);
        enterRef.current = enter;

        let last = -2;
        let wasDoor = false;
        tl.eventCallback("onUpdate", () => {
          const t = tl.time();
          const idx = stepOf(t);
          if (idx !== last) {
            last = idx;
            setStep(idx);
          }
          const door = t >= DOOR_AT - 0.15;
          if (door !== wasDoor) {
            wasDoor = door;
            atDoorRef.current = door;
            setAtDoor(door);
          }
          bar.style.transform = `scaleX(${Math.min(1, t / DOOR_AT)})`;
        });

        stRef.current = ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: () => "+=" + Math.round(window.innerHeight * D * PX_PER_UNIT),
          pin: true,
          scrub: 0.7,
          animation: tl,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          ...(SNAP
            ? {
                snap: {
                  snapTo: "labels" as const,
                  directional: true,
                  delay: 0.15,
                  duration: { min: 0.35, max: 1.1 },
                  ease: "power2.inOut",
                },
              }
            : {}),
        });

        return () => {
          stRef.current = null;
          enterRef.current = null;
        };
      });

      return () => mm.revert();
    },
    { scope: root, dependencies: [tick], revertOnUpdate: true }
  );

  /* smooth scroll to a point in the timeline */
  const scrollToY = (y: number, done?: () => void) => {
    const l = getLenis();
    if (l) {
      l.scrollTo(y, {
        duration: 1.8,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        onComplete: () => done?.(),
      });
    } else {
      window.scrollTo({ top: y, behavior: "smooth" });
      if (done) window.setTimeout(done, 1200);
    }
  };
  const scrollToT = (t: number, done?: () => void) => {
    const st = stRef.current;
    if (!st) return;
    scrollToY(st.start + (t / durRef.current) * (st.end - st.start), done);
  };

  /* click a neuron: scroll to its moment in the tour */
  const goTo = (i: number) => {
    if (reduced.current) {
      setStep(i);
      return;
    }
    scrollToT(TOUR_START + i * STEP + SETTLE);
  };

  /* opening the door is always a press */
  const startEnter = () => {
    const e = enterRef.current;
    if (!e || phase.current !== "outside") return;
    phase.current = "entering";
    setEntering(true);
    getLenis()?.stop();
    e.timeScale(1).play();
  };

  const openDoor = () => {
    if (reduced.current) {
      gsap.to(".inside", { autoAlpha: 1, duration: 0.6 });
      setInside(true);
      return;
    }
    if (atDoorRef.current) {
      startEnter();
      return;
    }
    scrollToT(DOOR_AT, () => window.setTimeout(startEnter, 800));
  };

  const leave = () => {
    if (reduced.current) {
      gsap.to(".inside", { autoAlpha: 0, duration: 0.4 });
      setInside(false);
      return;
    }
    setInside(false);
    enterRef.current?.timeScale(1.5).reverse();
  };

  const p = projects[shown];

  return (
    <section id="top" ref={root} className={`world ${active >= 0 ? "has-active" : ""}`}>
      <h1 className="sr-only">{profile.name} — {profile.title}</h1>

      <div className="world__cam">
        <div className="world__stage">
          <Image
            className="world__img"
            src={WORLD_SRC}
            alt="Illustrated creative developer studio shopfront"
            fill
            priority
            sizes="100vw"
          />

          <div
            className="door"
            style={{ left: `${DOOR.x}%`, top: `${DOOR.y}%`, width: `${DOOR.w}%`, height: `${DOOR.h}%` }}
          >
            <div className="door__light" />
            <div
              className="door__leaf"
              style={{
                backgroundImage: `url(${WORLD_SRC})`,
                backgroundSize: `${10000 / DOOR.w}% ${10000 / DOOR.h}%`,
                backgroundPosition: `${(DOOR.x / (100 - DOOR.w)) * 100}% ${(DOOR.y / (100 - DOOR.h)) * 100}%`,
              }}
            />
          </div>

          <svg className="world__net" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" aria-hidden="true">
            {projects.map((_, i) =>
              i === 0 ? null : (
                <path
                  key={i}
                  className="net__seg"
                  data-i={i}
                  d={curve(i)}
                  pathLength={1}
                  style={{ strokeDasharray: "1 1", strokeDashoffset: 1 }}
                />
              )
            )}
          </svg>

          {projects.map((pr, i) => (
            <button
              key={pr.slug}
              className={`node ${active === i ? "is-active" : ""} ${active > i ? "is-seen" : ""}`}
              style={{ left: `${pr.spot.x}%`, top: `${pr.spot.y}%` }}
              onClick={() => (pr.kind === "invite" && atDoor ? openDoor() : goTo(i))}
              aria-label={pr.kind === "invite" ? "Open the door" : `Project ${i + 1}: ${pr.title}`}
            >
              <span className="node__dot" />
              <span className="node__label">{pr.kind === "invite" && atDoor ? "Open the door" : pr.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="world__lantern" aria-hidden="true" />

      <div className={`guide ${inside || entering ? "is-off" : ""}`} aria-hidden="true">
        <i className="guide__bar" />
        <p className={`guide__hint ${active === 0 ? "is-on" : ""}`}>Keep scrolling. It stops at each project.</p>
      </div>

      <div className="world__intro">
        <div className="world__badge">
          <span className="world__dot" />
          {profile.availability}
        </div>
        <div className="world__hint">Scroll to explore</div>
      </div>

      <aside className={`pcard ${active >= 0 ? "is-on" : ""}`} aria-live="polite">
        <div className="pcard__top">
          <span className="pcard__num">
            {String(shown + 1).padStart(2, "0")}
            <small>/{String(n).padStart(2, "0")}</small>
          </span>
          <span className="pcard__tag">{p.tag}</span>
        </div>
        <h3>{p.title}</h3>
        <p className="pcard__role">{p.role}</p>
        <p>{p.summary}</p>
        {p.kind === "case" && (
          <dl>
            <div>
              <dt>The problem</dt>
              <dd>{p.problem}</dd>
            </div>
            <div>
              <dt>The result</dt>
              <dd>{p.result}</dd>
            </div>
          </dl>
        )}
        <ul className="pcard__stack">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {p.kind === "invite" && (
          <div className="pcard__row">
            <button className="pcard__cta" onClick={openDoor}>
              Open the door <DoorOpen size={18} />
            </button>
            <a className="pcard__cta pcard__cta--ghost" href={`mailto:${profile.email}`}>
              Start a project <ArrowUpRight size={18} />
            </a>
          </div>
        )}
      </aside>

      <nav className={`rail ${active >= 0 ? "is-on" : ""}`} aria-label="Projects">
        {projects.map((pr, i) => (
          <button
            key={pr.slug}
            className={`rail__dot ${active === i ? "is-active" : ""}`}
            onClick={() => goTo(i)}
            aria-label={pr.title}
          />
        ))}
      </nav>

      <div className={`doorcta ${atDoor && !entering && !inside ? "is-on" : ""}`}>
        <button
          className="doorcta__btn"
          onClick={openDoor}
          tabIndex={atDoor && !entering && !inside ? 0 : -1}
        >
          <DoorOpen size={18} /> Open the door
        </button>
        <span>{reduced.current ? "Step inside the studio" : "Not ready? Scroll up to look again"}</span>
      </div>

      {!inside && !entering && (
        <button className="world__skip" onClick={() => scrollToT(0.8)}>
          Skip the tour
        </button>
      )}

      <Inside active={inside} onExit={leave} />
      <div className="door__bloom" aria-hidden="true" />
    </section>
  );
}
