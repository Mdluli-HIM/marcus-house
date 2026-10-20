export type ArtNote = { title?: string; made?: string; year?: string; note?: string };

/** key = file name without extension, e.g. "07-neon-city" */
export const notes: Record<string, ArtNote> = {
  // "07-neon-city": { made: "Three.js + GLSL", year: "2026", note: "A city that breathes with the scroll." },
};
