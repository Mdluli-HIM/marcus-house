"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export type RoomApi = {
  /** x, y are 0..1 across the picture, y measured from the top */
  ripple: (x: number, y: number, strength?: number) => void;
  /** 1 = lamp on, 0 = lamp off */
  setLamp: (v: number) => void;
};

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
}
`;

const FRAG = `
uniform sampler2D uTex;
uniform float uTime;
uniform float uAspect;
uniform float uLamp;
uniform float uFlick;
uniform float uMotion;
uniform vec2 uMouse;
uniform vec4 uRip[6];
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = vUv;
  vec2 asp = vec2(uAspect, 1.0);
  vec2 off = vec2(0.0);

  /* sea and palms shimmer through the window */
  float win = smoothstep(0.66, 0.72, uv.x) * smoothstep(0.42, 0.5, uv.y) * (1.0 - smoothstep(0.93, 0.98, uv.y));
  off.x += sin(uv.y * 60.0 + uTime * 1.2) * 0.0008 * win * uMotion;
  off.y += sin(uv.x * 50.0 - uTime) * 0.0004 * win * uMotion;

  /* press ripples */
  for (int i = 0; i < 6; i++) {
    vec4 r = uRip[i];
    float age = uTime - r.z;
    if (age > 0.0 && age < 2.6) {
      vec2 p = (uv - r.xy) * asp;
      float d = length(p);
      float x = (d - age * 0.45) * 11.0;
      float ring = exp(-x * x);
      vec2 dir = p / max(d, 0.0001);
      off += (dir / asp) * ring * 0.014 * r.w * exp(-age * 1.5);
    }
  }

  vec3 col;
  col.r = texture2D(uTex, uv + off * 1.25).r;
  col.g = texture2D(uTex, uv + off).g;
  col.b = texture2D(uTex, uv + off * 0.75).b;

  /* lamp light */
  float a1 = length((uv - vec2(0.755, 0.85)) * asp) * 6.0;
  col += vec3(1.0, 0.78, 0.35) * exp(-a1 * a1) * 0.2 * uFlick;
  float a2 = length((uv - vec2(0.44, 0.64)) * asp) * 7.0;
  col += vec3(1.0, 0.5, 0.18) * exp(-a2 * a2) * 0.4 * uLamp * uFlick;
  col *= mix(0.7, 1.0, uLamp);

  /* warm glow that follows the pointer */
  float a3 = length((uv - uMouse) * asp) * 4.0;
  col += vec3(1.0, 0.82, 0.55) * exp(-a3 * a3) * 0.05;

  /* film grain */
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.035;

  gl_FragColor = vec4(col, 1.0);
}
`;

const P_VERT = `
attribute vec4 aSeed;
uniform float uTime;
uniform float uPx;
uniform float uMotion;
varying float vA;
void main() {
  float s = aSeed.z;
  float x = fract(aSeed.x + uTime * 0.0025 * s + sin(uTime * 0.35 * s + aSeed.w * 6.283) * 0.012);
  float y = fract(aSeed.y + uTime * 0.006 * s);
  vA = (0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * s * 1.6 + aSeed.w * 40.0)))
     * (0.35 + 0.65 * smoothstep(0.3, 0.9, x)) * uMotion;
  gl_Position = vec4(x * 2.0 - 1.0, y * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = (2.0 + aSeed.w * 4.0) * uPx;
}
`;

const P_FRAG = `
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 2.0) * vA;
  gl_FragColor = vec4(1.0, 0.86, 0.55, a * 0.9);
}
`;

export default function RoomGL({
  active,
  onReady,
}: {
  active: boolean;
  onReady: (api: RoomApi | null) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const readyRef = useRef(onReady);

  useEffect(() => {
    activeRef.current = active;
    readyRef.current = onReady;
  });

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: false, powerPreference: "high-performance" });
    } catch {
      return; /* no WebGL: the plain image stays visible */
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const u = {
      uTex: { value: null as THREE.Texture | null },
      uTime: { value: 0 },
      uAspect: { value: 1.7768 },
      uLamp: { value: 1 },
      uFlick: { value: 1 },
      uMotion: { value: reduce ? 0 : 1 },
      uMouse: { value: new THREE.Vector2(-5, -5) },
      uRip: { value: Array.from({ length: 6 }, () => new THREE.Vector4(0, 0, -100, 0)) },
    };
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, depthTest: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    scene.add(mesh);

    /* dust motes drifting in the light */
    const N = 80;
    const seeds = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      seeds[i * 4] = Math.random();
      seeds[i * 4 + 1] = Math.random();
      seeds[i * 4 + 2] = 0.5 + Math.random();
      seeds[i * 4 + 3] = Math.random();
    }
    const pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    pgeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    const pu = { uTime: { value: 0 }, uPx: { value: 1 }, uMotion: u.uMotion };
    const pmat = new THREE.ShaderMaterial({
      uniforms: pu,
      vertexShader: P_VERT,
      fragmentShader: P_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(pgeo, pmat);
    points.frustumCulled = false;
    scene.add(points);

    const resize = () => {
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      if (!w || !h) return;
      const pr = Math.max(0.75, Math.min(window.devicePixelRatio, 2, Math.sqrt(4.5e6 / (w * h))));
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      u.uAspect.value = w / h;
      pu.uPx.value = pr;
    };
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const t0 = performance.now();
    const now = () => (performance.now() - t0) / 1000;
    let disposed = false;
    let ready = false;
    let lamp = 1;
    let lampT = 1;
    let ri = 0;
    const mouse = new THREE.Vector2(-5, -5);
    const mouseT = new THREE.Vector2(-5, -5);

    new THREE.TextureLoader().load("/images/interior.png", (tex) => {
      if (disposed) {
        tex.dispose();
        return;
      }
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      u.uTex.value = tex;
      resize();
      renderer.render(scene, camera);
      ready = true;
      cv.parentElement?.setAttribute("data-gl", "1");
    });

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouseT.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    window.addEventListener("pointermove", onMove);

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!ready || !activeRef.current || document.hidden) return;
      const t = now();
      u.uTime.value = t;
      pu.uTime.value = t;
      lamp += (lampT - lamp) * 0.07;
      u.uLamp.value = lamp;
      mouse.lerp(mouseT, 0.08);
      u.uMouse.value.copy(mouse);
      u.uFlick.value = reduce ? 1 : 1 - (0.06 + 0.06 * Math.sin(t * 2.3) * Math.sin(t * 5.1));
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    readyRef.current({
      ripple: (x, y, s = 1) => {
        u.uRip.value[ri].set(x, 1 - y, now(), s);
        ri = (ri + 1) % 6;
      },
      setLamp: (v) => {
        lampT = v;
      },
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      readyRef.current(null);
      cv.parentElement?.removeAttribute("data-gl");
      geo.dispose();
      mat.dispose();
      pgeo.dispose();
      pmat.dispose();
      u.uTex.value?.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvas} className="inside__gl" aria-hidden="true" />;
}
