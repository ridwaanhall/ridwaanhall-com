/**
 * Measure which theme each skill icon vanishes on.
 *
 *   node scripts/measure-icon-tones.mjs            # dry run: print what it found
 *   node scripts/measure-icon-tones.mjs --apply    # write `media_asset.tone`
 *
 * Many skill icons are drawn in one colour: Next.js, Django and Pandas in
 * near-black, Flask, Vercel and ChatGPT in near-white. On a page of the
 * opposite shade they disappear, so a single-tone icon is inverted on the
 * theme it would vanish against -- and every icon in its own colours is left
 * exactly as its makers drew it.
 *
 * **Measured, not guessed.** A guess from the file's colour values catches
 * perhaps half of them (an SVG may set its fill in CSS, in a `style`, or by
 * inheritance), so each icon is rendered in a browser and its visible pixels
 * are averaged. A dark icon has a mean luminance under 0.23, whatever its
 * colour: a very dark green or navy is as invisible on a black page as black
 * is. The six that fall under it sit well apart from the next (0.22 against
 * 0.29), so the line is not tuned to any one of them. A light icon is over
 * 0.85 *and* has almost no colour, which keeps a pale chart in its own
 * colours.
 *
 * Idempotent: it measures every icon a skill names and writes only the rows
 * whose answer changed, so it is also how a newly uploaded icon is classified.
 * Run it after adding a skill with an icon from the admin.
 */
import { config } from "dotenv";
import { chromium } from "playwright";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");
const SUPABASE = (process.env.STORAGE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

const url = new URL(process.env.STORAGE_POSTGRES_URL);
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), max: 2, ssl: { rejectUnauthorized: false } });

const { rows } = await pool.query(`
  select distinct m.id, m.storage_key, m.source, m.tone, string_agg(distinct s.name, ', ') as names
  from app.skill s join app.media_asset m on m.id = s.icon_id
  group by m.id order by names
`);

const src = (row) =>
  row.source === "static"
    ? `file://${process.cwd()}/public${row.storage_key}`
    : `${SUPABASE}/storage/v1/object/public/${BUCKET}/${row.storage_key.split("/").map(encodeURIComponent).join("/")}`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent("<canvas id=c width=128 height=128></canvas>");

const measured = [];
for (const row of rows) {
  const res = await fetch(src(row));
  if (!res.ok) {
    console.log(`  skip  ${row.names}: ${res.status}`);
    continue;
  }
  const svg = await res.text();
  const stats = await page.evaluate(async (markup) => {
    const image = new Image();
    image.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
    await image.decode().catch(() => {});
    const ctx = document.getElementById("c").getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, 128, 128);
    ctx.drawImage(image, 0, 0, 128, 128);
    const { data } = ctx.getImageData(0, 0, 128, 128);
    let weight = 0, lum = 0, sat = 0;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3] / 255;
      if (a < 0.12) continue;
      const [r, g, b] = [data[i] / 255, data[i + 1] / 255, data[i + 2] / 255];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      weight += a;
      lum += a * (0.2126 * r + 0.7152 * g + 0.0722 * b);
      sat += a * (max === 0 ? 0 : (max - min) / max);
    }
    return weight < 20 ? null : { lum: lum / weight, sat: sat / weight };
  }, svg);
  if (!stats) {
    console.log(`  skip  ${row.names}: nothing drawn`);
    continue;
  }
  const tone = stats.lum < 0.23 ? "dark" : stats.sat < 0.12 && stats.lum > 0.85 ? "light" : null;
  measured.push({ ...row, tone: tone, was: row.tone, ...stats });
}
await browser.close();

const dark = measured.filter((m) => m.tone === "dark"), light = measured.filter((m) => m.tone === "light");
// --show lists the borderline icons with their numbers, for tuning the two thresholds.
if (process.argv.includes("--show"))
  measured
    .filter((m) => m.lum < 0.4 || m.lum > 0.75)
    .sort((a, b) => a.lum - b.lum)
    .forEach((m) => console.log(`  lum ${m.lum.toFixed(2)}  sat ${m.sat.toFixed(2)}  ${m.names}`));
console.log(`\n${measured.length} icons measured: ${dark.length} dark, ${light.length} light, ${measured.length - dark.length - light.length} in their own colours`);
console.log("  dark :", dark.map((m) => m.names).join("; "));
console.log("  light:", light.map((m) => m.names).join("; "));

const changed = measured.filter((m) => (m.tone ?? null) !== (m.was ?? null));
console.log(`\n${changed.length} row(s) would change`);
if (APPLY) {
  for (const m of changed) await pool.query("update app.media_asset set tone = $2 where id = $1", [m.id, m.tone]);
  console.log("written.");
} else console.log("dry run: pass --apply to write.");
await pool.end();
