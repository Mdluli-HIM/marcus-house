export type Shot = { src: string; caption: string; size: "full" | "half" };
export type Detail = {
  role: string;
  year: string;
  duration: string;
  client: string;
  stack: string[];
  brief: string;
  approach: string;
  result: string;
  gallery: Shot[];
};

/* placeholder gallery: swap the extension and captions when your real images are in */
const shots = (slug: string): Shot[] => [
  { src: `/work/${slug}/01.svg`, caption: "Home page", size: "full" },
  { src: `/work/${slug}/02.svg`, caption: "Detail view", size: "half" },
  { src: `/work/${slug}/03.svg`, caption: "On mobile", size: "half" },
  { src: `/work/${slug}/04.svg`, caption: "Components", size: "full" },
];

export const fallback: Detail = {
  role: "Design and development",
  year: "2026",
  duration: "4 weeks",
  client: "Personal project",
  stack: ["Next.js", "TypeScript"],
  brief: "What the project had to do, and for whom.",
  approach: "How you designed and built it.",
  result: "What changed because of it.",
  gallery: [],
};

const base = (slug: string, over: Partial<Detail>): Detail => ({
  ...fallback,
  gallery: shots(slug),
  ...over,
});

export const details: Record<string, Detail> = {
  point22: {
    role: "Creative direction, UI/UX design & front-end development",
    year: "2026",
    duration: "6 weeks",
    client: "Personal project",
    stack: [
      "Next.js 16.4",
      "React 19",
      "TypeScript",
      "GSAP",
      "Embla Carousel",
      "Lenis",
      "Custom CSS",
      "Next.js Image",
    ],
    brief:
      "Reimagine the traditional photography portfolio as an immersive, experimental digital archive. Point22 explores how photography, motion and interaction can come together to create an experience that feels less like browsing a website and more like stepping inside a photographer's visual world.",
    approach:
      "Built around an infinite, draggable photographic timeline inspired by analogue film. The experience combines monochromatic imagery, an interactive photographic ruler, image-specific timestamps and locations, and custom GSAP transitions that transform photographs into negatives, contact sheets and developed prints. Each photography collection features an editorial project viewer, handwritten storytelling, gesture-based navigation and carefully choreographed motion. A minimal interface keeps the photography at the centre of the experience.",
    result:
      "An unconventional, responsive photography archive featuring 64 photographs across three collections, seamless image-to-image navigation, cinematic darkroom-inspired page transitions and immersive project storytelling. The final experience blends analogue photographic aesthetics with modern interaction design, creating a distinctive digital identity for Point22.",
    gallery: [
      { src: "/work/point22/01.jpg", caption: "The View — photographic collage and editorial homepage", size: "full" },
      { src: "/work/point22/02.jpg", caption: "Timeline — infinite photographic archive with an interactive analogue ruler", size: "half" },
      { src: "/work/point22/03.jpg", caption: "Responsive experience — mobile photography and gesture navigation", size: "half" },
      { src: "/work/point22/04.jpg", caption: "Project viewer — handwritten storytelling, photographic prints and darkroom transitions", size: "full" },
    ],
  },
  "project-two": base("project-two", {}),
  "project-three": base("project-three", {}),
  "project-four": base("project-four", {}),
  "project-five": base("project-five", {}),
};
