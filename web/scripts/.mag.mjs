import { chromium } from "playwright";
const P = process.argv[2];
for (const base of ["https://ridwaanhall.com", "http://localhost:3000"]) {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(base + P, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2000);
  const info = await page.evaluate(() => {
    const btn = document.querySelector(".gallery-frame .magnify-button");
    if (!btn) return { present: false };
    const r = btn.getBoundingClientRect();
    const cs = getComputedStyle(btn);
    return {
      present: true,
      rect: `x=${Math.round(r.x)} y=${Math.round(r.y)} w=${Math.round(r.width)} h=${Math.round(r.height)}`,
      display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
      parent: btn.parentElement.className.toString().slice(0, 60),
      parentPos: getComputedStyle(btn.parentElement).position,
    };
  });
  console.log(base, JSON.stringify(info));
  await b.close();
}
