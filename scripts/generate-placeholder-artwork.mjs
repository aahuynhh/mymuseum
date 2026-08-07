// Generates original, abstract placeholder artwork as lightweight SVGs for the
// MyMuseum demo collection. These are procedurally composed geometric/gradient
// studies -- not derived from or imitating any existing artwork -- standing in
// for many different real artists' uploads. Deliberately varied in palette,
// brightness, and composition style so the museum's interface (which stays
// muted) isn't competing visually with the art it's displaying.
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "artwork");
mkdirSync(outDir, { recursive: true });

const W = 1200;
const H = 900;

/** Deterministic pseudo-random generator so output is stable across runs. */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function horizon(rng, [bg, a, b, c]) {
  const horizonY = H * (0.4 + rng() * 0.2);
  let shapes = `<rect width="${W}" height="${H}" fill="${bg}" />`;
  shapes += `<rect x="0" y="${horizonY}" width="${W}" height="${H - horizonY}" fill="${a}" opacity="0.9" />`;
  for (let i = 0; i < 5; i++) {
    const r = 50 + rng() * 220;
    const cx = rng() * W;
    const cy = horizonY * (0.15 + rng() * 0.65);
    shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${i % 2 === 0 ? b : c}" opacity="0.22" />`;
  }
  shapes += `<circle cx="${(W * (0.2 + rng() * 0.6)).toFixed(1)}" cy="${(horizonY * 0.3).toFixed(1)}" r="${(60 + rng() * 40).toFixed(1)}" fill="${c}" opacity="0.55" />`;
  return shapes;
}

function bands(rng, [bg, a, b, c]) {
  let shapes = `<rect width="${W}" height="${H}" fill="${bg}" />`;
  const bandCount = 4 + Math.floor(rng() * 3);
  let y = 0;
  const colors = [a, b, c];
  for (let i = 0; i < bandCount; i++) {
    const h = H / bandCount + (rng() - 0.5) * 70;
    shapes += `<rect x="0" y="${y.toFixed(1)}" width="${W}" height="${h.toFixed(1)}" fill="${colors[i % colors.length]}" opacity="${(0.4 + rng() * 0.4).toFixed(2)}" />`;
    y += h;
  }
  return shapes;
}

function windows(rng, [bg, a, b, c]) {
  let shapes = `<rect width="${W}" height="${H}" fill="${bg}" />`;
  const cols = 2 + Math.floor(rng() * 2);
  const rows = 2 + Math.floor(rng() * 2);
  const pad = 80;
  const cellW = (W - pad * 2) / cols;
  const cellH = (H - pad * 2) / rows;
  const colors = [a, b, c];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let cCol = 0; cCol < cols; cCol++) {
      const x = pad + cCol * cellW + cellW * (0.06 + rng() * 0.08);
      const y = pad + r * cellH + cellH * (0.06 + rng() * 0.08);
      const w = cellW * (0.7 + rng() * 0.14);
      const h = cellH * (0.7 + rng() * 0.14);
      shapes += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="14" fill="${colors[idx % colors.length]}" opacity="${(0.6 + rng() * 0.3).toFixed(2)}" />`;
      idx++;
    }
  }
  return shapes;
}

function orbs(rng, [bg, a, b, c]) {
  let shapes = `<rect width="${W}" height="${H}" fill="${bg}" />`;
  const colors = [a, b, c];
  for (let i = 0; i < 10; i++) {
    const r = 35 + rng() * 160;
    const cx = rng() * W;
    const cy = rng() * H;
    shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${colors[i % colors.length]}" opacity="${(0.32 + rng() * 0.42).toFixed(2)}" />`;
  }
  return shapes;
}

function splatter(rng, [bg, a, b, c]) {
  let shapes = `<rect width="${W}" height="${H}" fill="${bg}" />`;
  const colors = [a, b, c];
  for (let i = 0; i < 22; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    const rx = 8 + rng() * 70;
    const ry = 8 + rng() * 70;
    const rot = rng() * 360;
    shapes += `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)})" fill="${colors[i % colors.length]}" opacity="${(0.25 + rng() * 0.4).toFixed(2)}" />`;
  }
  for (let i = 0; i < 40; i++) {
    const cx = rng() * W;
    const cy = rng() * H;
    const r = 1.5 + rng() * 4;
    shapes += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${colors[(i + 1) % colors.length]}" opacity="${(0.4 + rng() * 0.4).toFixed(2)}" />`;
  }
  return shapes;
}

function radial(rng, [bg, a, b, c]) {
  let shapes = `<rect width="${W}" height="${H}" fill="${bg}" />`;
  const cx = W / 2;
  const cy = H / 2;
  const rings = 6 + Math.floor(rng() * 4);
  const colors = [a, b, c];
  for (let i = rings; i > 0; i--) {
    const r = (Math.max(W, H) * 0.55 * i) / rings;
    shapes += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${colors[i % colors.length]}" opacity="${(0.16 + (rings - i) * 0.02).toFixed(2)}" />`;
  }
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2 + rng() * 0.2;
    const dist = 120 + rng() * 260;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const r = 10 + rng() * 34;
    shapes += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${colors[i % colors.length]}" opacity="0.55" />`;
  }
  return shapes;
}

const styleFns = { horizon, bands, windows, orbs, splatter, radial };

// Fourteen compositions in genuinely different palettes/styles/brightness --
// independent of the site's own muted interface palette on purpose.
const compositions = [
  { slug: "kinetic-fields", style: "windows", seed: 101, palette: ["#f4ede1", "#c62828", "#1e5aa8", "#e8b91a"] },
  { slug: "bloomfield", style: "orbs", seed: 102, palette: ["#faf1f3", "#e8a3b8", "#c9a8e0", "#9fd8b8"] },
  { slug: "ink-study-i", style: "splatter", seed: 103, palette: ["#f2f2f0", "#1a1a1a", "#5c5c5c", "#8f8f8f"] },
  { slug: "ember-horizon", style: "horizon", seed: 104, palette: ["#2a1220", "#e8622c", "#f2a63d", "#8a1f3d"] },
  { slug: "deep-current", style: "horizon", seed: 105, palette: ["#0d2333", "#12455c", "#2f7d8c", "#dce8e2"] },
  { slug: "static-bloom", style: "splatter", seed: 106, palette: ["#1c0f1c", "#e0357f", "#a83b8f", "#f2c4dd"] },
  { slug: "ochre-fragments", style: "windows", seed: 107, palette: ["#f0e4cd", "#b5652f", "#7a4a25", "#d99a4e"] },
  { slug: "jewel-lattice", style: "windows", seed: 108, palette: ["#111a17", "#1f8a5f", "#1a4f8f", "#8a1f3d"] },
  { slug: "charcoal-figure-study", style: "splatter", seed: 109, palette: ["#e8e6e1", "#2b2b2b", "#4a4a4a", "#767676"] },
  { slug: "pop-stack", style: "windows", seed: 110, palette: ["#fdf6e3", "#f2c14e", "#e8622c", "#1a1a1a"] },
  { slug: "lavender-field", style: "orbs", seed: 111, palette: ["#f3f0f6", "#b9a6d9", "#8fae8a", "#e0b8c4"] },
  { slug: "gilded-bloom", style: "radial", seed: 112, palette: ["#241016", "#7a1f33", "#c9a24b", "#f2d9a0"] },
  { slug: "coral-reverie", style: "orbs", seed: 113, palette: ["#eef7f6", "#3fa8a0", "#f2876b", "#f2d06b"] },
  { slug: "grayscale-skyline", style: "bands", seed: 114, palette: ["#eceeee", "#3a3a3a", "#7a7a7a", "#b5b5b5"] },
];

for (const comp of compositions) {
  const rng = mulberry32(comp.seed);
  const body = styleFns[comp.style](rng, comp.palette);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
  writeFileSync(path.join(outDir, `${comp.slug}.svg`), svg, "utf8");
  console.log(`wrote ${comp.slug}.svg`);
}
