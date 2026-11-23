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
    slug: "tzaneen-taxi",
    title: "Tzaneen Taxi",
    kind: "case",
    tag: "Ride-hailing web app",
    role: "Product design and development",
    summary:
      "Name-your-price rides for Tzaneen's villages, installable like a native app.",
    problem:
      "No reliable, fairly priced way to book local transport, and no safety net once you're in the car.",
    result:
      "Live with SMS sign-in, driver offers, trip sharing and an SOS button.",
    stack: ["Next.js 16", "Express 5", "SQLite", "Web Push"],
    spot: { x: 31, y: 62 },
  },
  {
    slug: "fresh-goods",
    title: "Fresh Goods",
    kind: "case",
    tag: "Grocery e-commerce",
    role: "Product design and direction",
    summary:
      "A calm grocery shop where finding food is easy and checkout takes three steps.",
    problem:
      "Online grocery shopping feels cluttered: products are hard to find and checkout drags.",
    result:
      "Typo-tolerant search with South African synonyms, delivery slots and live order tracking.",
    stack: ["Next.js 16", "SQLite", "Drizzle", "Playwright"],
    spot: { x: 61, y: 63 },
  },
  {
    slug: "lifely",
    title: "Lifely",
    kind: "case",
    tag: "Healthcare app and dashboard",
    role: "Product lead and design direction, built with Claude Code",
    summary:
      "A calm patient app and a dense clinic dashboard, sharing one design system.",
    problem:
      "Patients need calm, clinicians need density, and health data needs strict privacy.",
    result:
      "Privacy enforced in the database, with 725 automated tests and double booking blocked.",
    stack: ["Expo", "Next.js 16", "Supabase", "Row Level Security"],
    spot: { x: 79, y: 62 },
  },
  {
    slug: "the-wellness-app",
    title: "The Wellness App",
    kind: "case",
    tag: "Mobile app, in progress",
    role: "Product owner, built with Claude Code",
    summary:
      "Daily wellness for lifters, runners and walkers, with crews compared by % improvement only.",
    problem:
      "Fitness apps rank people by raw numbers, so beginners lose before they start.",
    result:
      "Check-ins, GPS runs with Ghost mode, progress photos and crews, with 2,191 app tests passing.",
    stack: ["Expo", "TypeScript", "Supabase", "Row Level Security"],
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
