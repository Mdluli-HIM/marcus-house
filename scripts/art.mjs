import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";

const dir = "public/gallery";
mkdirSync(dir, { recursive: true });

let count = 0;
try {
  count = JSON.parse(readFileSync("src/data/gallery.json", "utf8")).frames.length;
} catch {
  console.log("art.json: run scripts/gallery.py first");
  process.exit(0);
}

const nice = (s) => {
  const t = s.replace(/[-_]+/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "Untitled";
};

const files = readdirSync(dir)
  .filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const slots = Array(count).fill(null);
const loose = [];
for (const f of files) {
  const base = f.replace(/\.[^.]+$/, "");
  const m = base.match(/^(\d+)[-_ ]*(.*)$/);
  const piece = { src: encodeURI(`/gallery/${f}`), file: base, title: nice(m ? m[2] : base) };
  const n = m ? parseInt(m[1], 10) : 0;
  if (n >= 1 && n <= count && !slots[n - 1]) slots[n - 1] = piece;
  else loose.push(piece);
}
for (const p of loose) {
  const i = slots.indexOf(null);
  if (i === -1) {
    console.log(`art.json: no free frame for ${p.file}`);
    break;
  }
  slots[i] = p;
}

writeFileSync("src/data/art.json", JSON.stringify(slots, null, 2) + "\n");
console.log(`art.json: ${slots.filter(Boolean).length} of ${count} frames filled`);
