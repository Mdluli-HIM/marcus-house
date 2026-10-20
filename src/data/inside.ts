import { profile } from "@/data/profile";

export type Hotspot = {
  id: string;
  label: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  points?: string[];
  cta?: { label: string; href: string };
  /** position on the interior image, in % */
  spot: { x: number; y: number };
  zoom: number;
};

export const hotspots: Hotspot[] = [
  {
    id: "about",
    label: "About me",
    kicker: "Hello",
    title: "I'm Marcus.",
    paragraphs: [
      "I'm a creative designer and software developer based in Limpopo, South Africa. I design interfaces and build them myself, so what gets approved is what ships.",
      "[Replace this with your story: where you started, what you care about, what you're working on now.]",
    ],
    points: ["Creative designer", "Software developer", "Open for work"],
    spot: { x: 62, y: 54 },
    zoom: 2.0,
  },
  {
    id: "services",
    label: "What I build",
    kicker: "Services",
    title: "Things I can make for you",
    paragraphs: ["Design and code under one roof, from the first sketch to a fast, finished site."],
    points: [
      "UI and UX design",
      "Front-end development",
      "Motion and interaction",
      "Full websites and web apps",
    ],
    spot: { x: 84, y: 62 },
    zoom: 1.8,
  },
  {
    id: "stack",
    label: "Toolbox",
    kicker: "Skills",
    title: "What's on the shelf",
    paragraphs: ["The tools I reach for most when building for the web."],
    points: [
      "Next.js 16 and React 19",
      "TypeScript",
      "GSAP and Lenis for motion and scroll",
      "Embla Carousel",
      "Custom CSS",
      "Git and GitHub",
    ],
    spot: { x: 36, y: 30 },
    zoom: 2.1,
  },
  {
    id: "process",
    label: "How I work",
    kicker: "Process",
    title: "Design. Build. Iterate. Repeat.",
    paragraphs: ["Short loops with real work you can react to, instead of long silences followed by a big reveal."],
    points: [
      "1. Listen and define the goal",
      "2. Design it and agree on the look",
      "3. Build it and ship early",
      "4. Refine with feedback",
    ],
    spot: { x: 13, y: 28 },
    zoom: 2.2,
  },
  {
    id: "beyond",
    label: "Beyond the code",
    kicker: "Off the clock",
    title: "Coffee first.",
    paragraphs: [
      "Coffee first, then code. Roxy, my Chow × Husky, keeps me company: she is calm, well behaved, mostly asleep, and always up for a walk.",
    ],
    spot: { x: 70.5, y: 45 },
    zoom: 2.4,
  },
  {
    id: "contact",
    label: "Say hello",
    kicker: "Contact",
    title: "Let's make something.",
    paragraphs: ["I'm open for work. Tell me what you have in mind and I'll reply with how I'd approach it."],
    points: [profile.email, profile.location],
    cta: { label: "Send an email", href: `mailto:${profile.email}` },
    spot: { x: 3.2, y: 28 },
    zoom: 2.2,
  },
];
