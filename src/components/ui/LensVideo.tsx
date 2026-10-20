"use client";
import { useEffect, useRef, useState } from "react";
import clipsData from "@/data/clips.json";

const clips = clipsData as string[];

export default function LensVideo() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const failed = useRef<Set<number>>(new Set());

  // play the active clip from the start, pause and rewind the rest
  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      if (i === active) {
        el.currentTime = 0;
        el.play().catch(() => {});
      } else {
        el.pause();
      }
    });
  }, [active]);

  if (clips.length === 0) return null;

  // go to the next clip that hasn't failed, wrapping around
  const advance = (from: number) => {
    for (let step = 1; step <= clips.length; step++) {
      const n = (from + step) % clips.length;
      if (failed.current.has(n)) continue;
      if (n === from) {
        const el = refs.current[from];
        if (el) {
          el.currentTime = 0;
          el.play().catch(() => {});
        }
      } else {
        setActive(n);
      }
      return;
    }
  };

  return (
    <>
      {clips.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            refs.current[i] = el;
          }}
          src={src}
          muted
          playsInline
          preload="auto"
          autoPlay={i === 0}
          onEnded={() => advance(i)}
          onError={() => {
            failed.current.add(i);
            if (i === active) advance(i);
          }}
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}
    </>
  );
}
