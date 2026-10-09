/**
 * Photograph each project's live address and file the picture as its first image.
 *
 *   npx tsx --conditions=react-server scripts/capture-project-previews.mjs                  # dry run: capture, write nothing
 *   npx tsx --conditions=react-server scripts/capture-project-previews.mjs --apply          # upload and attach
 *   npx tsx --conditions=react-server scripts/capture-project-previews.mjs --only=<slug>    # redo one project
 *
 * A project with a `demo_url` and no image named `live-*` gets one: a 1440x900
 * capture, stored under a content-addressed key like any upload, put first in
 * the gallery with the older images after it. The capture is rejected when
 * almost every pixel is one colour (a blank or errored page is not a preview),
 * and pages known to show a sleep or error screen are excluded below. Look at
 * the files in the temp `shots` folder before passing `--apply`.
 *
 * Re-running is safe: a project that already has a live image is skipped, and
 * `--only` replaces its own by removing the old link first.
 */
import { config } from "dotenv"; import fs from "node:fs";
config({ path: ".env.local", quiet: true });
const APPLY = process.argv.includes("--apply");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const { pool } = await import("../lib/db/client.ts");
const { objectKeyFor } = await import("../lib/storage/keys.ts");
const { putObject } = await import("../lib/storage/objects.ts");
const { chromium } = await import("playwright");
const sharp = (await import("sharp")).default;
const q = (t, p = []) => pool.query(t, p).then((r) => r.rows);
const projects = await q(`select p.id, p.slug, p.title, p.demo_url, exists(select 1 from app.project_image i join app.media_asset m on m.id=i.media_id where i.project_id=p.id and m.original_filename like 'live-%') has_live from app.project p where p.demo_url is not null and p.slug not in ('bike-rental-insights-dashboard','pddikti-data-vault') ${only ? "and p.slug = '" + only.replace(/'/g, "") + "'" : ""} order by p.created_at desc`);
const browser = await chromium.launch();
const out = [];
for (const p of projects) {
  if (p.has_live && !only) { console.log("  have ", p.slug); continue; }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await ctx.newPage();
  try {
    await page.goto(p.demo_url, { waitUntil: "load", timeout: 25000 });
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2500);
    const png = await page.screenshot({ type: "png" });
    const webp = await sharp(png).resize(1440, 900).webp({ quality: 82 }).toBuffer();
    // a blank page is not a preview: reject if almost every pixel is one colour
    const { channels } = await sharp(png).stats();
    const flat = channels.slice(0, 3).every((c) => c.stdev < 6);
    fs.mkdirSync(process.env.TEMP + "/shots", { recursive: true });
    fs.writeFileSync(`${process.env.TEMP}/shots/${p.slug}.webp`, webp);
    console.log(flat ? "  FLAT " : "  shot ", p.slug, webp.length, p.demo_url);
    if (!flat) out.push({ p, webp });
  } catch (e) { console.log("  fail ", p.slug, String(e.message).split("\n")[0].slice(0, 80)); }
  await ctx.close();
}
await browser.close();
if (APPLY) {
  for (const { p, webp } of out) {
    const filename = `live-${p.slug}.webp`;
    const built = objectKeyFor("project", filename, new Uint8Array(webp));
    if (!built.ok) { console.log("  key  ", p.slug, built.error); continue; }
    await putObject(built.key, new Uint8Array(webp), built.contentType);
    const client = await pool.connect();
    try {
      await client.query("begin");
      let { rows: [m] } = await client.query("select id from app.media_asset where storage_key=$1", [built.key]);
      if (!m) ({ rows: [m] } = await client.query("insert into app.media_asset (storage_key, original_filename, alt, source) values ($1,$2,$3,'storage') returning id", [built.key, filename, `The ${p.title} site, open at ${new URL(p.demo_url).host}`]));
      await client.query("delete from app.project_image where project_id=$1 and media_id=$2", [p.id, m.id]);
      await client.query("update app.project_image set position = position + 1 where project_id=$1", [p.id]);
      await client.query("insert into app.project_image (project_id, media_id, position) values ($1,$2,0)", [p.id, m.id]);
      await client.query("commit");
      console.log("  added", p.slug);
    } catch (e) { await client.query("rollback"); console.log("  ROLLBACK", p.slug, e.message); } finally { client.release(); }
  }
}
await pool.end();
