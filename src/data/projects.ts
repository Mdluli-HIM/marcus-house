import type { Project } from "@/types";

export const projects: Project[] = [
  {
    slug: "point22",
    title: "Point22",
    kind: "case",
    tag: "Experimental editorial site",
    role: "Design and front-end development",
    summary:
      "An analogue photography site where every transition feels like working in a darkroom.",
    problem:
      "Make a photographer's archive feel like a darkroom instead of a gallery grid.",
    result:
      "An infinite draggable timeline, negative-to-print page transitions and a story page for every photograph.",
    stack: ["Next.js 16", "React 19", "TypeScript", "GSAP", "Embla", "Lenis"],
    spot: { x: 16, y: 34 },
  },
  {
    slug: "project-two",
    title: "Project Two",
    kind: "case",
    tag: "Placeholder",
    role: "Your role here",
    summary: "Swap in a real project: what it was and what you made.",
    problem: "The problem this project had to solve.",
    result: "What changed because of your work.",
    stack: ["Next.js", "TypeScript"],
    spot: { x: 31, y: 62 },
  },
  {
    slug: "project-three",
    title: "Project Three",
    kind: "case",
    tag: "Placeholder",
    role: "Your role here",
    summary: "Another real project goes here.",
    problem: "The problem this project had to solve.",
    result: "What changed because of your work.",
    stack: ["React", "GSAP"],
    spot: { x: 61, y: 63 },
  },
  {
    slug: "project-four",
    title: "Project Four",
    kind: "case",
    tag: "Placeholder",
    role: "Your role here",
    summary: "A motion or interaction piece works well here.",
    problem: "The problem this project had to solve.",
    result: "What changed because of your work.",
    stack: ["UI design", "Motion"],
    spot: { x: 69, y: 33 },
  },
  {
    slug: "open-for-ideas",
    title: "Open for ideas",
    kind: "invite",
    tag: "Your project",
    role: "Design and development",
    summary:
      "The door is open. Tell me what you want to make and I'll tell you how I'd build it.",
    problem: "",
    result: "",
    stack: ["UI design", "Next.js", "Motion"],
    spot: { x: 49, y: 66 },
  },
];
