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

// Tzaneen Taxi: inserted as the second poster on the wall
works.splice(1, 0, {
  slug: "tzaneen-taxi",
  title: "Tzaneen Taxi",
  subtitle: "Name-your-price rides for Tzaneen's villages",
  colors: ["#111111", "#D9372C"],
  mockup: "/work/tzaneen-taxi.png",
  specs: [
    "Riders name a price, drivers offer",
    "Next.js PWA with Express API",
    "SQLite triggers prevent double-booking",
    "SMS sign-in, SOS, trip sharing",
  ],
  live: "https://tzaneenride.co.za",
  figma: "",
});

// Fresh Goods: inserted as the third poster on the wall
works.splice(2, 0, {
  slug: "fresh-goods",
  title: "Fresh Goods",
  subtitle: "Responsive grocery shop web app",
  colors: ["#16664B", "#FF591F"],
  mockup: "/work/fresh-goods.png",
  specs: [
    "Next.js 16, JavaScript, CSS Modules",
    "Typo-tolerant search, SA synonyms",
    "Private demo stores via join code",
    "Checkout with delivery slots, test payments",
  ],
  live: "",
  figma: "",
});

// The Wellness App: inserted as the fourth poster on the wall
works.splice(3, 0, {
  slug: "the-wellness-app",
  title: "The Wellness App",
  subtitle: "Daily wellness for lifters, runners and walkers",
  colors: ["#000000", "#7DDCA9"],
  mockup: "/work/the-wellness-app.png",
  specs: [
    "Check-ins, sleep, training, progress photos",
    "GPS runs with Ghost mode",
    "Crews compared by % only",
    "Expo, TypeScript, Supabase",
  ],
  live: "",
  figma: "",
});

// Lifely: inserted as the fifth poster on the wall
works.splice(4, 0, {
  slug: "lifely",
  title: "Lifely",
  subtitle: "Patient app and clinic dashboard, one system",
  colors: ["#E6E6E4", "#D0FF30"],
  mockup: "/work/lifely.png",
  specs: [
    "Expo patient app, Next.js dashboard",
    "Supabase Postgres with row-level security",
    "Compulsory two-step login for staff",
    "Double booking blocked by database",
  ],
  live: "",
  figma: "",
});
