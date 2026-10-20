import type Lenis from "lenis";

/* the page's one Lenis instance, so sections can lock or drive the scroll */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = () => instance;
