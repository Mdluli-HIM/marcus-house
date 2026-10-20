export type Service = {
  title: string;
  description: string;
  deliverables: string[];
};

export type Project = {
  slug: string;
  title: string;
  kind: "case" | "invite";
  tag: string;
  role: string;
  summary: string;
  problem: string;
  result: string;
  stack: string[];
  /** where the neuron sits on the shopfront image, in % */
  spot: { x: number; y: number };
};
