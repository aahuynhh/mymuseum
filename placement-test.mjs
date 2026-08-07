import sharp from "sharp";

async function img(w, h, color) {
  const buf = await sharp({ create: { width: w, height: h, channels: 3, background: color } }).jpeg().toBuffer();
  return { dataUrl: "data:image/jpeg;base64," + buf.toString("base64"), aspect: w / h };
}

// A range of scenarios: extreme aspect ratios, varied counts, to stress the
// "never overlap, never cross a corner" guarantees of the new algorithm.
const scenarios = [
  {
    name: "2 items, extreme aspect ratios",
    images: [
      { w: 2400, h: 400, color: { r: 200, g: 100, b: 50 } }, // 6:1 panorama
      { w: 300, h: 2200, color: { r: 50, g: 100, b: 200 } }, // very tall
    ],
  },
  {
    name: "3 items, mixed",
    images: [
      { w: 1600, h: 500, color: { r: 200, g: 100, b: 50 } },
      { w: 900, h: 900, color: { r: 100, g: 200, b: 100 } },
      { w: 600, h: 1400, color: { r: 150, g: 50, b: 200 } },
    ],
  },
  {
    name: "10 items, all square (max count)",
    images: Array.from({ length: 10 }, (_, i) => ({
      w: 800,
      h: 800,
      color: { r: (i * 25) % 255, g: (i * 60) % 255, b: (i * 90) % 255 },
    })),
  },
  {
    name: "4 items, all extreme panoramas",
    images: Array.from({ length: 4 }, (_, i) => ({
      w: 3000,
      h: 400,
      color: { r: 200, g: i * 40, b: 50 },
    })),
  },
  {
    name: "1 item alone",
    images: [{ w: 1920, h: 1080, color: { r: 80, g: 80, b: 200 } }],
  },
];

let totalChecks = 0;
let totalFailures = 0;

for (const scenario of scenarios) {
  const artworks = [];
  for (const spec of scenario.images) {
    const { dataUrl, aspect } = await img(spec.w, spec.h, spec.color);
    artworks.push({
      title: `Piece ${artworks.length + 1}`,
      artist: "Test Artist",
      medium: "Digital",
      year: 2026,
      imageDataUrl: dataUrl,
      imageAspectRatio: aspect,
    });
  }

  const res = await fetch("http://localhost:3000/api/museums", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `Placement Test - ${scenario.name} - ${Date.now()}`,
      description: "Automated placement invariant check",
      theme: "sage",
      artworks,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.log(`[${scenario.name}] FAILED to create museum:`, data);
    totalFailures++;
    continue;
  }

  // Fetch the stored museum data via the store's internal shape by hitting
  // the museum page's data indirectly isn't exposed as JSON, so read the
  // file-backed store directly.
  const fs = await import("node:fs");
  const store = JSON.parse(fs.readFileSync(".mymuseum-data/museums.json", "utf8"));
  const museum = store[data.museumId];
  if (!museum) {
    console.log(`[${scenario.name}] museum not found in store`);
    totalFailures++;
    continue;
  }

  const room = museum.rooms[0];
  const bounds = room.bounds;
  console.log(`\n=== ${scenario.name} === room bounds: x[${bounds.minX.toFixed(2)},${bounds.maxX.toFixed(2)}] z[${bounds.minZ.toFixed(2)},${bounds.maxZ.toFixed(2)}]`);

  // Group artworks by wall (inferred from wallPosition)
  const byWall = {};
  for (const a of museum.artworks) {
    const wp = a.wallPosition;
    let wall;
    if (Math.abs(wp.z - bounds.minZ) < 0.01) wall = "north";
    else if (Math.abs(wp.z - bounds.maxZ) < 0.01) wall = "south";
    else if (Math.abs(wp.x - bounds.maxX) < 0.01) wall = "east";
    else wall = "west";
    (byWall[wall] ??= []).push(a);
  }

  for (const [wall, items] of Object.entries(byWall)) {
    const isNS = wall === "north" || wall === "south";
    const spanMin = isNS ? bounds.minX : bounds.minZ;
    const spanMax = isNS ? bounds.maxX : bounds.maxZ;

    // Sort by position along the wall
    items.sort((a, b) => (isNS ? a.wallPosition.x - b.wallPosition.x : a.wallPosition.z - b.wallPosition.z));

    for (const a of items) {
      totalChecks++;
      const center = isNS ? a.wallPosition.x : a.wallPosition.z;
      const half = a.frameWidth / 2;
      const left = center - half;
      const right = center + half;
      const fitsWall = left >= spanMin - 0.001 && right <= spanMax + 0.001;
      // Aspect ratio preserved (within float tolerance) OR clamped range
      const frameAspect = a.frameWidth / a.frameHeight;
      console.log(
        `  [${wall}] "${a.title}" frame=${a.frameWidth.toFixed(2)}x${a.frameHeight.toFixed(2)} ` +
        `center=${center.toFixed(2)} span=[${left.toFixed(2)},${right.toFixed(2)}] ` +
        `wallSpan=[${spanMin.toFixed(2)},${spanMax.toFixed(2)}] fitsWall=${fitsWall} frameAspect=${frameAspect.toFixed(2)} sourceAspect=${a.imageAspectRatio.toFixed(2)}`
      );
      if (!fitsWall) {
        console.log(`    !! FAIL: frame extends outside wall span`);
        totalFailures++;
      }
    }

    // Check no overlap between consecutive items on the same wall
    for (let i = 1; i < items.length; i++) {
      totalChecks++;
      const prev = items[i - 1];
      const cur = items[i];
      const prevCenter = isNS ? prev.wallPosition.x : prev.wallPosition.z;
      const curCenter = isNS ? cur.wallPosition.x : cur.wallPosition.z;
      const prevRight = prevCenter + prev.frameWidth / 2;
      const curLeft = curCenter - cur.frameWidth / 2;
      const gap = curLeft - prevRight;
      if (gap < -0.001) {
        console.log(`    !! FAIL: overlap between "${prev.title}" and "${cur.title}", gap=${gap.toFixed(3)}`);
        totalFailures++;
      }
    }
  }
}

console.log(`\n\nTOTAL CHECKS: ${totalChecks}, FAILURES: ${totalFailures}`);
process.exit(totalFailures > 0 ? 1 : 0);
