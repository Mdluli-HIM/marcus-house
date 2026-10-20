"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ArrowUpRight, DoorClosed, Volume2, VolumeX, X } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { hotspots } from "@/data/inside";
import { cafe, type SfxName } from "@/lib/audio";
import RoomGL, { type RoomApi } from "@/components/ui/RoomGL";
import Gallery from "@/components/sections/Gallery";
import WorkWall from "@/components/sections/WorkWall";
import roxyData from "@/data/roxy.json";

const IA = 1.7778;

type Mood = "sleep" | "wake" | "sit" | "bark";
type RoxyData = { ready: boolean; born: string; box: { x: number; y: number; w: number; h: number }; poses: string[] };
const ROXY = roxyData as RoxyData;

/* the red-sun poster is the way into the art wall. x, y are % of the room picture */
const ART_SPOT = { x: 63, y: 17 };

/* the open notebook on the desk is the way into the project wall */
const BOOK_SPOT = { x: 64, y: 72 };
const mug = hotspots.find((h) => h.id === "beyond")!;

/* things you can press that don't open a panel. x, y, w, h are % of the picture */
type Toy = { id: string; label: string; x: number; y: number; w: number; h: number; say: string; sfx: SfxName };
const toys: Toy[] = [
  { id: "dog", label: "Wake up Roxy", x: 36, y: 77, w: 26, h: 28, say: "woof!", sfx: "woof" },
  { id: "board", label: "Spin the skateboard", x: 22.8, y: 64, w: 7, h: 30, say: "kickflip!", sfx: "board" },
  { id: "lamp", label: "Toggle the desk lamp", x: 44, y: 37, w: 7, h: 11, say: "", sfx: "lamp" },
  { id: "window", label: "Listen to the beach", x: 86, y: 33, w: 24, h: 36, say: "caw caw!", sfx: "gull" },
];

/* what each hotspot sounds like when pressed */
const spotSfx: Record<string, SfxName> = {
  about: "chime",
  services: "keys",
  stack: "page",
  process: "chalk",
  beyond: "clink",
  contact: "ring",
};

type Pop = { id: number; x: number; y: number; t: string };

const find = (el: HTMLElement | null, s: string) => el?.querySelector(s) as HTMLElement | null;

export default function Inside({ active, onExit }: { active: boolean; onExit: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const gl = useRef<RoomApi | null>(null);
  const cur = useRef<HTMLDivElement>(null);
  const openRef = useRef(-1);
  const popId = useRef(0);

  const [open, setOpen] = useState(-1);
  const [sound, setSound] = useState(false);
  const [lampOn, setLampOn] = useState(true);
  const [pops, setPops] = useState<Pop[]>([]);
  const [gallery, setGallery] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [explore, setExplore] = useState(false);
  const galleryRef = useRef(false);
  const galleryTimer = useRef<number | null>(null);
  const [wall, setWall] = useState(false);
  const wallTimer = useRef<number | null>(null);
  const [mood, setMood] = useState<Mood>("sleep");
  const moodRef = useRef<Mood>("sleep");
  const roxyTimers = useRef<number[]>([]);
  const pets = useRef(0);

  /* glide the camera to a hotspot and open its panel */
  const go = useCallback((i: number) => {
    const el = root.current;
    const c = find(el, ".inside__cam");
    const stage = find(el, ".inside__stage");
    if (!el || !c || !stage) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const small = vw < 800;
    const h = hotspots[i];
    const s = small ? h.zoom * 0.75 : h.zoom * 0.9;
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    const ox = stage.offsetLeft;
    const oy = stage.offsetTop;
    const px = ox + (h.spot.x / 100) * sw;
    const py = oy + (h.spot.y / 100) * sh;
    const tx = small ? vw * 0.5 : h.spot.x > 50 ? vw * 0.66 : vw * 0.34;
    const ty = small ? vh * 0.28 : vh * 0.5;
    gsap.to(c, {
      scale: s,
      x: gsap.utils.clamp(vw - s * (ox + sw), -s * ox, tx - s * px),
      y: gsap.utils.clamp(vh - s * (oy + sh), -s * oy, ty - s * py),
      duration: 1.6,
      ease: "power3.inOut",
      overwrite: true,
    });
    openRef.current = i;
    setOpen(i);
    cafe.setFocus(true);
    cafe.play("whoosh");
    gl.current?.ripple(h.spot.x / 100, h.spot.y / 100, 1.3);
  }, []);

  const close = useCallback(() => {
    const c = find(root.current, ".inside__cam");
    if (c) gsap.to(c, { scale: 1, x: 0, y: 0, duration: 1.4, ease: "power3.inOut", overwrite: true });
    openRef.current = -1;
    setOpen(-1);
    cafe.setFocus(false);
    cafe.play("whoosh");
  }, []);

  /* leaving the room resets everything */
  useEffect(() => {
    if (active) return;
    const c = find(root.current, ".inside__cam");
    if (c) gsap.set(c, { scale: 1, x: 0, y: 0 });
    openRef.current = -1;
    setOpen(-1);
    setLampOn(true);
    gl.current?.setLamp(1);
    cafe.setFocus(false);
    if (galleryTimer.current) window.clearTimeout(galleryTimer.current);
    galleryRef.current = false;
    setGallery(false);
    if (wallTimer.current) window.clearTimeout(wallTimer.current);
    setWall(false);
  }, [active]);

  /* music plays only while you are in the room and the tab is visible */
  useEffect(() => {
    const upd = () => cafe.setPresent(active && !document.hidden);
    upd();
    document.addEventListener("visibilitychange", upd);
    return () => document.removeEventListener("visibilitychange", upd);
  }, [active]);
  useEffect(() => () => cafe.setPresent(false), []);

  /* the Explore menu closes on Esc, on an outside click, and when you leave */
  useEffect(() => {
    if (!active) setExplore(false);
  }, [active]);
  useEffect(() => {
    if (!explore) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExplore(false);
    };
    const away = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".explore")) setExplore(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", away);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", away);
    };
  }, [explore]);

  /* each room has its own music */
  useEffect(() => {
    cafe.setScene(gallery ? "gallery" : wall ? "jazz" : "cafe");
  }, [gallery, wall]);

  /* a calm welcome when you step in */
  useEffect(() => {
    if (!active) {
      setWelcome(false);
      return;
    }
    setWelcome(true);
    const a = window.setTimeout(() => cafe.play("bell"), 500);
    const b = window.setTimeout(() => setWelcome(false), 7000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, [active]);

  /* an opened panel takes keyboard focus */
  useEffect(() => {
    if (open < 0) return;
    setWelcome(false);
    const t = window.setTimeout(() => {
      (root.current?.querySelector(".panel__close") as HTMLElement | null)?.focus({ preventScroll: true });
    }, 900);
    return () => window.clearTimeout(t);
  }, [open]);

  /* keyboard: Esc closes, arrows step through the room */
  useEffect(() => {
    if (!active) return;
    const key = (e: KeyboardEvent) => {
      if (galleryRef.current) return;
      const cu = openRef.current;
      const last = hotspots.length - 1;
      if (e.key === "Escape") {
        close();
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        if (cu >= 0 && cu < last) {
          e.preventDefault();
          go(cu + 1);
        }
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        if (cu >= 0) {
          e.preventDefault();
          if (cu === 0) close();
          else go(cu - 1);
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [active, go, close]);

  /* wheel: glide through the room. At either end it hands the scroll back to the page */
  useEffect(() => {
    const el = root.current;
    if (!el || !active) return;
    let acc = 0;
    let lock = 0;
    let last = 0;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest(".panel")) return;
      if (e.deltaY === 0) return;
      const cu = openRef.current;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (cu < 0 || (dir > 0 && cu >= hotspots.length - 1)) return;
      e.preventDefault();
      e.stopPropagation();
      const t = performance.now();
      if (t < lock) return;
      if (t - last > 250) acc = 0;
      last = t;
      acc += e.deltaY;
      if (Math.abs(acc) < 45) return;
      acc = 0;
      lock = t + 1100;
      if (dir > 0) go(cu + 1);
      else if (cu === 0) close();
      else go(cu - 1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [active, go, close]);

  /* pointer: parallax, trailing ring cursor, magnetic hotspots */
  useEffect(() => {
    const el = root.current;
    if (!el || !active) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const back = find(el, ".inside__stage")!;
    const fore = find(el, ".inside__fore")!;
    const ring = cur.current;
    const bx = gsap.quickTo(back, "x", { duration: 0.9, ease: "power3" });
    const by = gsap.quickTo(back, "y", { duration: 0.9, ease: "power3" });
    const fx = gsap.quickTo(fore, "x", { duration: 0.9, ease: "power3" });
    const fy = gsap.quickTo(fore, "y", { duration: 0.9, ease: "power3" });
    const rx = ring ? gsap.quickTo(ring, "x", { duration: 0.4, ease: "power3" }) : null;
    const ry = ring ? gsap.quickTo(ring, "y", { duration: 0.4, ease: "power3" }) : null;

    const move = (e: PointerEvent) => {
      if (!reduce) {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        bx(-nx * 10);
        by(-ny * 6);
        fx(nx * 44);
        fy(ny * 22);
      }
      rx?.(e.clientX);
      ry?.(e.clientY);
      ring?.classList.add("is-seen");
      const t = e.target as Element | null;
      ring?.classList.toggle("is-hot", !!t?.closest(".toy,.spot,.inside__chips button,.inside__sound,.inside__exit,.gallery button"));

      el.querySelectorAll<HTMLElement>(".spot").forEach((s) => {
        const mag = s.querySelector<HTMLElement>(".spot__mag");
        if (!mag) return;
        const r = s.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 120) {
          s.dataset.mag = "1";
          gsap.to(mag, { x: dx * 0.28, y: dy * 0.28, duration: 0.35, ease: "power3.out", overwrite: "auto" });
        } else if (s.dataset.mag === "1") {
          s.dataset.mag = "0";
          gsap.to(mag, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
        }
      });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [active]);

  /* ---------- pressing things ---------- */
  const addPop = (x: number, y: number, t: string) => {
    const id = ++popId.current;
    setPops((p) => [...p, { id, x, y, t }]);
    window.setTimeout(() => setPops((p) => p.filter((q) => q.id !== id)), 2700);
  };

  const puff = () => {
    const s = find(root.current, ".steam");
    if (!s) return;
    s.classList.remove("puff");
    void s.offsetWidth;
    s.classList.add("puff");
  };

  /* every press on the room sends a ripple through it */
  const press = (e: React.PointerEvent) => {
    const stage = find(root.current, ".inside__stage");
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    gl.current?.ripple(x, y, 1);
    cafe.play("tick");
  };

  /* ---------- Roxy ---------- */
  const later = (fn: () => void, ms: number) => {
    roxyTimers.current.push(window.setTimeout(fn, ms));
  };
  const stopRoxy = () => {
    roxyTimers.current.forEach((t) => window.clearTimeout(t));
    roxyTimers.current = [];
  };
  const poseOf = (m: Mood): Mood => {
    const order: Mood[] = ["bark", "sit", "wake", "sleep"];
    for (const c of order.slice(order.indexOf(m))) if (ROXY.poses.includes(c)) return c;
    return "sleep";
  };
  const setPose = (m: Mood) => {
    moodRef.current = m;
    setMood(poseOf(m));
  };
  const roxyAge = () => {
    const [y, mo] = ROXY.born.split("-").map(Number);
    const now = new Date();
    const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - mo);
    if (months < 1) return "a few weeks old";
    if (months < 24) return `${months} months old`;
    const yrs = Math.floor(months / 12);
    const rem = months % 12;
    return rem ? `${yrs} years, ${rem} mo old` : `${yrs} years old`;
  };
  const squash = (el: HTMLElement | null, k: number) => {
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(
      el,
      { scaleY: 1 - 0.14 * k, scaleX: 1 + 0.08 * k, y: -14 * k },
      { scaleX: 1, scaleY: 1, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)", transformOrigin: "50% 100%", overwrite: true }
    );
  };
  const sleepAgain = () => {
    setPose("wake");
    later(() => {
      setPose("sleep");
      addPop(36, 64, "zzz...");
    }, 1800);
  };
  const idle = () => later(sleepAgain, 9000);

  const roxyPress = () => {
    const el = find(root.current, ".roxy");
    const m = moodRef.current;
    if (m === "wake") return;
    stopRoxy();
    gl.current?.ripple(0.36, 0.78, 1.5);
    if (m === "sleep") {
      setPose("wake");
      cafe.play("yawn");
      addPop(36, 64, "five more minutes...");
      later(() => {
        setPose("bark");
        cafe.play("woof");
        addPop(36, 62, "woof! I'm Roxy.");
        squash(el, 1);
        later(() => setPose("sit"), 1000);
      }, 1600);
      later(() => addPop(36, 56, `Roxy · Chow × Husky · ${roxyAge()}`), 3000);
      later(idle, 3200);
      return;
    }
    pets.current += 1;
    setPose("bark");
    cafe.play("woof");
    addPop(36, 62, ["woof!", "good girl", "walkies?", "♥"][pets.current % 4]);
    squash(el, 0.7);
    later(() => setPose("sit"), 700);
    idle();
  };

  /* breathing */
  useEffect(() => {
    if (!ROXY.ready || !active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const s = find(root.current, ".roxy__sprite");
    if (!s) return;
    const asleep = mood === "sleep";
    const tw = gsap.to(s, {
      scaleY: asleep ? 1.014 : 1.006,
      duration: asleep ? 2.4 : 0.9,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      transformOrigin: "50% 100%",
    });
    return () => {
      tw.kill();
      gsap.set(s, { scaleY: 1 });
    };
  }, [mood, active]);

  /* leaving the room puts her back to sleep */
  useEffect(() => {
    if (active) return;
    stopRoxy();
    moodRef.current = "sleep";
    setMood("sleep");
    pets.current = 0;
  }, [active]);
  useEffect(() => () => stopRoxy(), []);

  const poke = (t: Toy) => {
    if (t.id === "dog" && ROXY.ready) {
      roxyPress();
      return;
    }
    cafe.play(t.sfx);
    gl.current?.ripple(t.x / 100, t.y / 100, 1.7);
    let say = t.say;
    if (t.id === "lamp") {
      const next = !lampOn;
      setLampOn(next);
      gl.current?.setLamp(next ? 1 : 0);
      say = next ? "let there be light" : "lights out";
    }
    if (say) addPop(t.x, t.y - t.h / 2, say);
  };

  const pick = (i: number) => {
    cafe.play(spotSfx[hotspots[i].id]);
    if (hotspots[i].id === "beyond") puff();
    go(i);
  };

  /* ---------- the art wall ---------- */
  const posterShot = () => {
    const stage = find(root.current, ".inside__stage");
    if (!stage) return { scale: 1, x: 0, y: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = vw < 800 ? 3 : 3.6;
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    const ox = stage.offsetLeft;
    const oy = stage.offsetTop;
    const px = ox + (ART_SPOT.x / 100) * sw;
    const py = oy + (ART_SPOT.y / 100) * sh;
    return {
      scale: s,
      x: gsap.utils.clamp(vw - s * (ox + sw), -s * ox, vw / 2 - s * px),
      y: gsap.utils.clamp(vh - s * (oy + sh), -s * oy, vh / 2 - s * py),
    };
  };

  const openGallery = () => {
    if (galleryRef.current) return;
    galleryRef.current = true;
    openRef.current = -1;
    setOpen(-1);
    cafe.setFocus(false);
    cafe.play("whoosh");
    gl.current?.ripple(ART_SPOT.x / 100, ART_SPOT.y / 100, 1.6);
    const c = find(root.current, ".inside__cam");
    if (c) gsap.to(c, { ...posterShot(), duration: 1.1, ease: "expo.in", overwrite: true });
    galleryTimer.current = window.setTimeout(() => setGallery(true), 800);
  };

  const leaveGallery = () => {
    if (galleryTimer.current) window.clearTimeout(galleryTimer.current);
    const c = find(root.current, ".inside__cam");
    if (c) {
      gsap.set(c, posterShot());
      gsap.to(c, { scale: 1, x: 0, y: 0, duration: 1.3, ease: "expo.out", delay: 0.2, overwrite: true });
    }
    galleryRef.current = false;
    setGallery(false);
    cafe.setFocus(false);
    cafe.play("whoosh");
  };

  const bookShot = () => {
    const stage = find(root.current, ".inside__stage");
    if (!stage) return { scale: 1, x: 0, y: 0 };
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = vw < 800 ? 3 : 3.6;
    const sw = stage.offsetWidth;
    const sh = stage.offsetHeight;
    const ox = stage.offsetLeft;
    const oy = stage.offsetTop;
    const px = ox + (BOOK_SPOT.x / 100) * sw;
    const py = oy + (BOOK_SPOT.y / 100) * sh;
    return {
      scale: s,
      x: gsap.utils.clamp(vw - s * (ox + sw), -s * ox, vw / 2 - s * px),
      y: gsap.utils.clamp(vh - s * (oy + sh), -s * oy, vh / 2 - s * py),
    };
  };

  const openWall = () => {
    if (galleryRef.current) return;
    galleryRef.current = true;
    openRef.current = -1;
    setOpen(-1);
    cafe.setFocus(false);
    cafe.play("page");
    gl.current?.ripple(BOOK_SPOT.x / 100, BOOK_SPOT.y / 100, 1.6);
    const c = find(root.current, ".inside__cam");
    if (c) gsap.to(c, { ...bookShot(), duration: 1.1, ease: "expo.in", overwrite: true });
    wallTimer.current = window.setTimeout(() => setWall(true), 800);
  };

  const leaveWall = () => {
    if (wallTimer.current) window.clearTimeout(wallTimer.current);
    const c = find(root.current, ".inside__cam");
    if (c) {
      gsap.set(c, bookShot());
      gsap.to(c, { scale: 1, x: 0, y: 0, duration: 1.3, ease: "expo.out", delay: 0.2, overwrite: true });
    }
    galleryRef.current = false;
    setWall(false);
    cafe.setFocus(false);
    cafe.play("whoosh");
  };

  const toggleSound = () => setSound(cafe.toggle());

  const h = open >= 0 ? hotspots[open] : null;

  return (
    <div
      ref={root}
      className={`inside ${active ? "is-live" : ""} ${open >= 0 ? "has-open" : ""} ${gallery || wall ? "in-gallery" : ""}`}
      aria-hidden={!active}
      style={{ ["--ia" as string]: IA }}
    >
      <div className="inside__cam">
        <div className="inside__stage" onPointerDown={press}>
          <Image
            className="inside__img"
            src="/images/interior.png"
            alt="Inside the studio: Marcus at his desk with a laptop and a cup of coffee"
            fill
            loading="eager"
            sizes="100vw"
          />
          <RoomGL
            active={active}
            onReady={(a) => {
              gl.current = a;
            }}
          />

          <span className="steam" style={{ left: `${mug.spot.x}%`, top: `${mug.spot.y - 9}%` }}>
            <i />
            <i />
            <i />
          </span>
          <span className={`zzz ${ROXY.ready && mood !== "sleep" ? "is-off" : ""}`} style={{ left: "28%", top: "74%" }}>
            <i>z</i>
            <i>z</i>
            <i>Z</i>
          </span>

          {ROXY.ready && (
            <div
              className={`roxy ${lampOn ? "" : "is-dim"}`}
              style={{ left: `${ROXY.box.x}%`, top: `${ROXY.box.y}%`, width: `${ROXY.box.w}%`, height: `${ROXY.box.h}%` }}
            >
              <div className="roxy__sprite">
                {ROXY.poses.map((p) => (
                  <img key={p} src={`/roxy/${p}.png`} alt="" draggable={false} className={mood === p ? "is-on" : ""} />
                ))}
              </div>
            </div>
          )}

          {toys.map((t) => (
            <button
              key={t.id}
              className="toy"
              style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, height: `${t.h}%` }}
              onClick={() => poke(t)}
              tabIndex={active ? 0 : -1}
              aria-label={t.label}
            />
          ))}

          {hotspots.map((s, i) => (
            <button
              key={s.id}
              className={`spot ${open === i ? "is-open" : ""}`}
              style={{ left: `${s.spot.x}%`, top: `${s.spot.y}%` }}
              onClick={() => pick(i)}
              tabIndex={active ? 0 : -1}
              aria-label={s.label}
            >
              <span className="spot__mag">
                <span className="spot__ring" />
                <span className="spot__dot" />
              </span>
              <span className="spot__tag">{s.label}</span>
            </button>
          ))}

          <button
            className="spot spot--art"
            style={{ left: `${ART_SPOT.x}%`, top: `${ART_SPOT.y}%` }}
            onClick={openGallery}
            tabIndex={active ? 0 : -1}
            aria-label="Open the art wall"
          >
            <span className="spot__mag">
              <span className="spot__ring" />
              <span className="spot__dot" />
            </span>
            <span className="spot__tag">Art wall</span>
          </button>

          <button
            className="spot spot--art"
            style={{ left: `${BOOK_SPOT.x}%`, top: `${BOOK_SPOT.y}%` }}
            onClick={openWall}
            tabIndex={active ? 0 : -1}
            aria-label="Open the project wall"
          >
            <span className="spot__mag">
              <span className="spot__ring" />
              <span className="spot__dot" />
            </span>
            <span className="spot__tag">Project wall</span>
          </button>

          {pops.map((p) => (
            <span key={p.id} className="pop" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {p.t}
            </span>
          ))}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="inside__fore"
          src="/images/interior-fore.png"
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      <Gallery open={gallery} onClose={leaveGallery} />
      <WorkWall open={wall} onClose={leaveWall} />

      <div className="inside__vignette" aria-hidden="true" />
      <div className="cur" ref={cur} aria-hidden="true">
        <i className="cur__ring" />
      </div>

      <p className="inside__hint">Press a glowing spot to look around</p>

      <div className={`welcome ${welcome && open < 0 ? "is-on" : ""}`} aria-hidden="true">
        <strong>Welcome in.</strong>
        <span>Nothing opens until you press it. Esc steps back.</span>
      </div>

      <button className="inside__exit" onClick={onExit} tabIndex={active ? 0 : -1}>
        <DoorClosed size={16} /> Step outside
      </button>

      <button
        className={`inside__sound ${sound ? "is-on" : ""}`}
        onClick={toggleSound}
        tabIndex={active ? 0 : -1}
        aria-pressed={sound}
      >
        {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span>{sound ? "Sound on" : "With sound"}</span>
        {sound && (
          <i className="eq" aria-hidden="true">
            <b />
            <b />
            <b />
            <b />
          </i>
        )}
      </button>

      <nav className="inside__chips" aria-label="Studio">
        {hotspots.map((s, i) => (
          <button key={s.id} className={open === i ? "is-on" : ""} onClick={() => pick(i)} tabIndex={active ? 0 : -1}>
            {s.label}
          </button>
        ))}
        <div className="explore">
          <button
            className={`is-wall ${explore ? "is-on" : ""}`}
            onClick={() => setExplore((v) => !v)}
            aria-expanded={explore}
            aria-haspopup="menu"
            tabIndex={active ? 0 : -1}
          >
            Explore {explore ? "▴" : "▾"}
          </button>
          <div className={`explore__menu ${explore ? "is-on" : ""}`} role="menu">
            <button
              role="menuitem"
              tabIndex={explore ? 0 : -1}
              onClick={() => {
                setExplore(false);
                openGallery();
              }}
            >
              Art wall
              <small>Pieces I made with code</small>
            </button>
            <button
              role="menuitem"
              tabIndex={explore ? 0 : -1}
              onClick={() => {
                setExplore(false);
                openWall();
              }}
            >
              Projects
              <small>Selected work and the archive</small>
            </button>
          </div>
        </div>
      </nav>

      <aside
        className={`panel ${h ? "is-on" : ""} ${h && h.spot.x > 50 ? "panel--left" : ""}`}
        aria-live="polite"
      >
        {h && (
          <>
            <button className="panel__close" onClick={close} aria-label="Close">
              <X size={18} />
            </button>
            <span className="panel__kicker">{h.kicker} · {String(open + 1).padStart(2, "0")} / {String(hotspots.length).padStart(2, "0")}</span>
            <h3>{h.title}</h3>
            {h.paragraphs.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {h.points && (
              <ul>
                {h.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
            {h.cta && (
              <a className="pcard__cta" href={h.cta.href}>
                {h.cta.label} <ArrowUpRight size={18} />
              </a>
            )}
          <div className="panel__nav">
              <button onClick={() => (open === 0 ? close() : pick(open - 1))}>
                <ArrowLeft size={16} /> {open === 0 ? "Close" : "Prev"}
              </button>
              <button disabled={open >= hotspots.length - 1} onClick={() => pick(open + 1)}>
                Next <ArrowRight size={16} />
              </button>
            </div>
            </>
        )}
      </aside>
    </div>
  );
}
