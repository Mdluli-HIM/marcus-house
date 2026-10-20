export type ArchiveItem = {
  slug: string;
  title: string;
  kind: "Website" | "App" | "Concept";
  year: string;
  blurb: string;
  stack: string[];
  /** two flat colours, used for the sleeve when there is no cover */
  colors: [string, string];
  /** optional square cover, 1200 x 1200, saved in public/archive */
  cover?: string;
  live?: string;
  figma?: string;
};

export const archive: ArchiveItem[] = [
  { slug: "one", title: "Project One", kind: "Website", year: "2026", blurb: "One line on what it is and what you made.", stack: ["Next.js", "GSAP"], colors: ["#e8531f", "#f2c14e"], live: "", figma: "" },
  { slug: "two", title: "Project Two", kind: "App", year: "2026", blurb: "One line on what it is and what you made.", stack: ["React", "TypeScript"], colors: ["#1f6f4a", "#cfe3c8"], live: "", figma: "" },
  { slug: "three", title: "Project Three", kind: "Concept", year: "2025", blurb: "One line on what it is and what you made.", stack: ["Figma", "Motion"], colors: ["#2b4fd8", "#f4a6b8"], live: "", figma: "" },
  { slug: "four", title: "Project Four", kind: "Website", year: "2025", blurb: "One line on what it is and what you made.", stack: ["UI design", "Next.js"], colors: ["#17140f", "#e8531f"], live: "", figma: "" },
  { slug: "five", title: "Project Five", kind: "App", year: "2025", blurb: "One line on what it is and what you made.", stack: ["Figma", "React"], colors: ["#7a3ff2", "#9be0c2"], live: "", figma: "" },
  { slug: "six", title: "Project Six", kind: "Website", year: "2024", blurb: "One line on what it is and what you made.", stack: ["HTML", "CSS", "JS"], colors: ["#c9a24b", "#2f3b2a"], live: "", figma: "" },
];
