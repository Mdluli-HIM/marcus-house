import { readdirSync, writeFileSync, mkdirSync } from "node:fs";

const dir = "public/videos";
mkdirSync(dir, { recursive: true });

const files = readdirSync(dir)
  .filter((f) => /\.(mp4|webm|mov)$/i.test(f))
  .sort()
  .map((f) => encodeURI(`/videos/${f}`));

writeFileSync("src/data/clips.json", JSON.stringify(files, null, 2) + "\n");
console.log(`clips.json: ${files.length} video(s)`);
