import { chromium } from "playwright";
import fs from "node:fs";

const OUT = "/private/tmp/claude-501/-Users-alaynahuynh3-Desktop-webweb/f737a2e2-2833-4122-aa7a-d6bcf2ab9ca8/scratchpad/shots/placement";
fs.mkdirSync(OUT, { recursive: true });

const store = JSON.parse(fs.readFileSync(".mymuseum-data/museums.json", "utf8"));
const ids = Object.keys(store).filter((k) => k.includes("placement-test"));

const browser = await chromium.launch({ channel: "chrome" });

async function hold(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}
async function look(page, dx, dy) {
  await page.mouse.move(720, 450);
  await page.mouse.down();
  await page.mouse.move(720 + dx, 450 + dy, { steps: 20 });
  await page.mouse.up();
  await page.waitForTimeout(400);
}

for (const id of ids) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`http://localhost:3000/museum/${id}`, { waitUntil: "load" });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${OUT}/${id}-spawn.png` });

  // Walk in and look at the north wall
  await hold(page, "KeyW", 1800);
  await look(page, 0, 60);
  await page.screenshot({ path: `${OUT}/${id}-north-wall.png` });

  await page.close();
}

await browser.close();
console.log("done");
