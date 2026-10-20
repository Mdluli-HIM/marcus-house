export type Work = {
  slug: string;
  title: string;
  subtitle: string;
  /** the two colours shown as squares on the poster */
  colors: [string, string];
  /** transparent PNG or WebP, about 1800 x 840 */
  mockup: string;
  /** small detail lines at the bottom left, 3 or 4 work best */
  specs: string[];
  live?: string;
  figma?: string;
};

export const works: Work[] = [
  {
    slug: "point22",
    title: "Point22",
    subtitle: "An experimental photographic archive",
    colors: ["#0A0A0A", "#E84755"],
    mockup: "/work/point22.png",
    specs: [
      "Role: Creative direction, UI/UX & development",
      "Stack: Next.js 16, React 19, TypeScript, GSAP",
      "Experience: Infinite archive & analogue motion",
      "Interaction: Darkroom transitions & storytelling",
    ],
    live: "https://point22.vercel.app/",
    figma: "",
  },
  {
    slug: "project-two",
    title: "Project Two",
    subtitle: "What this project is",
    colors: ["#1f6f4a", "#f2c14e"],
    mockup: "/work/project-two.svg",
    specs: [
      "Role: your role",
      "Stack: Next.js, TypeScript",
      "Year: 2026",
      "Status: live",
    ],
    live: "",
    figma: "",
  },
  {
    slug: "project-three",
    title: "Project Three",
    subtitle: "What this project is",
    colors: ["#2b4fd8", "#f4a6b8"],
    mockup: "/work/project-three.svg",
    specs: [
      "Role: your role",
      "Stack: React, GSAP",
      "Year: 2026",
      "Status: concept",
    ],
    live: "",
    figma: "",
  },
  {
    slug: "project-four",
    title: "Project Four",
    subtitle: "What this project is",
    colors: ["#17140f", "#e8531f"],
    mockup: "/work/project-four.svg",
    specs: [
      "Role: your role",
      "Stack: UI design, Motion",
      "Year: 2025",
      "Status: live",
    ],
    live: "",
    figma: "",
  },
  {
    slug: "project-five",
    title: "Project Five",
    subtitle: "What this project is",
    colors: ["#7a3ff2", "#9be0c2"],
    mockup: "/work/project-five.svg",
    specs: [
      "Role: your role",
      "Stack: Figma, React",
      "Year: 2025",
      "Status: concept",
    ],
    live: "",
    figma: "",
  },
];
