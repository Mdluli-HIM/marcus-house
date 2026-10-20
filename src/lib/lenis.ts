import type Lenis from "lenis";

let inst: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  inst = l;
};
export const getLenis = () => inst;
