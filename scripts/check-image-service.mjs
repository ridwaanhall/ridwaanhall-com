/**
 * The Site settings screen decides how pictures are resized, and this proves
 * the decision reaches a reader.
 *
 *   npx tsx --conditions=react-server scripts/check-image-service.mjs [http://localhost:3000]
 *
 * Signed in as the owner it saves each choice through the real form, then
 * opens the public Work page signed out and reads the address of the pictures:
 * Next's optimizer for `next`, wsrv.nl for `wsrv`, and the stored file itself
 * for `none`. It also tries a quality the form must refuse. The row is
 * snapshotted first and put back in a `finally`, with the restore proved.
 *
 * It saves rather than writing the row: the read is cached against the
 * `settings` tag, and only a save through the admin expires it, which is the
 * path a real change takes.
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { pool } = await import("../lib/db/client.ts");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";

let failures = 0;
const check = (name, pass, detail = "") => {
  if (!pass) failures++;
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${!pass && detail ? `  ${detail}` : ""}`);
};

const read = async () => (await pool.query("select image_service, image_quality from app.site_setting")).rows;
const before = await read();
check("exactly one settings row exists", before.length === 1);

const token = await encode({ token: { sub: await staffAccountId() }, secret: process.env.AUTH_SECRET, salt: COOKIE, maxAge: 60 * 15 });
const browser = await chromium.launch();

const owner = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await owner.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
const admin = await owner.newPage();
const reader = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();

async function save(service, quality) {
  await admin.goto(`${BASE}/admin/site-setting`, { waitUntil: "load" });
  await admin.waitForTimeout(700);
  const select = admin.locator('select[name="imageService"]');
  if (await select.isVisible()) await select.selectOption(service);
  else {
    const label = ((await select.locator(`option[value="${service}"]`).textContent()) ?? "").trim();
    await admin.locator('select[name="imageService"] + [role="combobox"]').click();
    await admin.getByRole("option", { name: label, exact: true }).first().click();
  }
  await admin.fill('[name="imageQuality"]', String(quality));
  await admin.locator('form:has(button[type="submit"]:text-matches("Save"))').locator('button[type="submit"]').click();
  await admin.waitForTimeout(1600);
  return ((await admin.locator("[data-sonner-toast]").first().textContent().catch(() => "")) ?? "").trim();
}

async function pictures() {
  await reader.goto(`${BASE}/projects`, { waitUntil: "load" });
  await reader.waitForTimeout(2500);
  return reader.$$eval(".pcard img", (imgs) => imgs.map((img) => decodeURIComponent(img.currentSrc || img.src)).filter(Boolean));
}

try {
  const wsrv = await save("wsrv", 70);
  check("saving wsrv is confirmed in words", wsrv.includes("Saved"), wsrv);
  check("and it is stored", (await read())[0].image_service === "wsrv" && (await read())[0].image_quality === 70);
  let srcs = await pictures();
  check("pictures are addressed to wsrv.nl at the chosen quality", srcs.length > 0 && srcs.every((s) => s.startsWith("https://wsrv.nl/") && s.includes("q=70") && s.includes("output=webp")), srcs[0]);

  await save("none", 70);
  srcs = await pictures();
  check("with resizing off, the stored file itself is served", srcs.length > 0 && srcs.every((s) => s.includes("/storage/v1/object/public/") && !s.includes("/_next/image") && !s.includes("wsrv.nl")), srcs[0]);

  await save("next", 80);
  srcs = await pictures();
  check("with Next.js, the optimizer is used at the chosen quality", srcs.length > 0 && srcs.every((s) => s.includes("/_next/image") && s.includes("q=80")), srcs[0]);

  const refused = await save("wsrv", 101);
  const kept = (await read())[0];
  // Refused twice over: the browser stops the submit at the field's own max, and
  // the server would refuse the number in words if a script got past that.
  const blockedByField = (await admin.locator('[name="imageQuality"]:invalid').count()) > 0;
  const refusedByServer = /above 100/i.test(refused) || /above 100/i.test(await admin.locator("body").innerText());
  check("a quality above 100 is refused", blockedByField || refusedByServer, refused);
  check("and nothing was stored", kept.image_service === "next" && kept.image_quality === 80);

  await reader.goto(`${BASE}/admin/site-setting`, { waitUntil: "load" });
  await reader.waitForTimeout(800);
  check("a signed-out reader cannot open the screen", !(await reader.locator('[name="imageQuality"]').count()));
} finally {
  await browser.close();
  await pool.query("update app.site_setting set image_service=$1, image_quality=$2", [before[0].image_service, before[0].image_quality]);
  const after = await read();
  check("the row is left as it was found", after.length === 1 && after[0].image_service === before[0].image_service && after[0].image_quality === before[0].image_quality);
  await pool.end();
}

console.log(failures ? `\n${failures} check(s) FAILED.` : "\nThe setting reaches the reader in every mode.");
process.exit(failures ? 1 : 0);
