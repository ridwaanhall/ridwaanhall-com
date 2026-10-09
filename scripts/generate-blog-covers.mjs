/**
 * Draw every post's cover in the site's own design, and file it as the post's
 * image.
 *
 * A cover is the first thing a card, a share preview and the top of a post
 * show, and the old ones were each made somewhere else in a different style --
 * glowing neon, stock renders, a different face on every one -- so the
 * writing index read as a collage rather than as one site. These are drawn
 * from the same rules the pages are: true black, the eight greys and no
 * accent, Funnel Display for the title, Geist for the lead and Geist Mono for
 * the facts, and a line drawing that says what the post is about.
 *
 *   npx tsx --conditions=react-server scripts/generate-blog-covers.mjs              # draw, write PNGs, change nothing
 *   npx tsx --conditions=react-server scripts/generate-blog-covers.mjs --apply      # upload and repoint the posts
 *   ... --slug=<slug>                                                              # one post only
 *
 * The dry run is the review: it writes each cover to `--out` (the system temp
 * folder by default) so the files are looked at before anything is uploaded.
 *
 * **The safe area is the middle.** A card crops the 1600x840 image to 16:10,
 * which takes about 130px off each side, and the post header crops to 2:1.
 * Nothing that has to be read sits outside the centre 1340px.
 *
 * Uploading goes through the same content-addressed key and `media_asset`
 * row an admin upload gets, so a cover is an ordinary image afterwards:
 * replaceable from the post's form, counted by `lib/storage/cleanup.ts`, and
 * deleted with the last row that names it. The images it replaces are handed
 * to `deleteUnreferenced`, which keeps any that something else still uses.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");
const ONLY = process.argv.find((arg) => arg.startsWith("--slug="))?.slice(7);
const OUT = process.argv.find((arg) => arg.startsWith("--out="))?.slice(6) ?? join(tmpdir(), "blog-covers");

const { chromium } = await import("playwright");
const { asc, eq } = await import("drizzle-orm");
const { db, pool } = await import("../lib/db/client.ts");
const { blogImage, blogPost, category, mediaAsset } = await import("../lib/db/app-schema.ts");
const { objectKeyFor } = await import("../lib/storage/keys.ts");
const { putObject } = await import("../lib/storage/objects.ts");
const { deleteUnreferenced } = await import("../lib/storage/cleanup.ts");

const W = 1600;
const H = 840;

/* The greys, as the dark theme names them in styles/site.css. */
const G = { bg: "#000000", line: "#1c1c1c", line2: "#2e2e2e", mute: "#7a7a7a", ink2: "#bdbdbd", ink: "#f2f2f2" };

/* ------------------------------------------------------------- drawings */
/*
 * Each is a 520x520 line drawing. Hairlines in the rule greys, the subject in
 * the muted grey, and one element in ink -- the thing the eye should land on.
 */
const stroke = (color, width = 2) => `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;
const mono = (x, y, text, color = G.mute, size = 15, anchor = "start") =>
  `<text x="${x}" y="${y}" fill="${color}" font-family="Geist Mono" font-size="${size}" text-anchor="${anchor}">${text}</text>`;

const DRAW = {
  gauge: () => {
    const arc = (r, from, to) => {
      const p = (a) => [260 + r * Math.cos((Math.PI * a) / 180), 300 - r * Math.sin((Math.PI * a) / 180)];
      const [x1, y1] = p(from);
      const [x2, y2] = p(to);
      return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`;
    };
    const ticks = Array.from({ length: 19 }, (_, i) => {
      const a = (Math.PI * (180 - i * 10)) / 180;
      const r1 = i % 3 ? 172 : 164;
      return `<line x1="${260 + r1 * Math.cos(a)}" y1="${300 - r1 * Math.sin(a)}" x2="${260 + 182 * Math.cos(a)}" y2="${300 - 182 * Math.sin(a)}" ${stroke(G.mute, 2)}/>`;
    }).join("");
    const needle = (Math.PI * 38) / 180;
    return `
      <path d="${arc(200, 180, 0)}" ${stroke(G.line2, 2)}/>
      <path d="${arc(200, 180, 50)}" ${stroke(G.mute, 6)}/>
      <path d="${arc(200, 50, 0)}" ${stroke(G.ink, 6)} stroke-dasharray="2 10"/>
      ${ticks}
      <line x1="260" y1="300" x2="${260 + 150 * Math.cos(needle)}" y2="${300 - 150 * Math.sin(needle)}" ${stroke(G.ink, 4)}/>
      <circle cx="260" cy="300" r="12" fill="${G.ink}"/>
      ${mono(260, 352, "MEMORY THRESHOLD", G.mute, 14, "middle")}
      <rect x="120" y="390" width="120" height="74" rx="6" ${stroke(G.mute)}/><rect x="280" y="390" width="120" height="74" rx="6" ${stroke(G.mute)}/>
      <line x1="138" y1="414" x2="200" y2="414" ${stroke(G.line2)}/><line x1="298" y1="414" x2="360" y2="414" ${stroke(G.line2)}/>
      <circle cx="218" cy="414" r="4" fill="${G.ink}"/><circle cx="378" cy="414" r="4" fill="${G.ink}"/>
      ${mono(138, 448, "mlbb", G.ink2, 14)}${mono(298, 448, "pddikti", G.ink2, 14)}`;
  },
  orbit: () => `
      ${[230, 170, 112].map((r, i) => `<ellipse cx="260" cy="260" rx="${r}" ry="${r * 0.42}" transform="rotate(-18 260 260)" ${stroke(i ? G.line2 : G.mute, 1.5)} ${i === 1 ? 'stroke-dasharray="3 7"' : ""}/>`).join("")}
      <circle cx="260" cy="260" r="46" fill="${G.ink}"/>
      <circle cx="260" cy="260" r="64" ${stroke(G.line2, 1.5)}/>
      <circle cx="${260 + 218 * Math.cos(-0.3)}" cy="${260 + 92 * Math.sin(-0.3) - 70}" r="18" ${stroke(G.ink, 2.5)}/>
      <circle cx="122" cy="318" r="9" fill="${G.mute}"/>
      ${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 97) % 500 + 10}" cy="${(i * 61) % 500 + 10}" r="${i % 4 ? 1.2 : 2}" fill="${i % 5 ? G.mute : G.ink2}"/>`).join("")}
      <path d="M40 470 L140 470 L156 492 L172 470 L480 470" ${stroke(G.mute, 1.5)}/>
      ${mono(40, 504, "TRANSIT DIP", G.mute, 13)}`,
  pillars: () => {
    const heights = [210, 170, 190, 150, 175, 140];
    const cols = heights
      .map((h, i) => {
        const x = 60 + i * 72;
        return `<rect x="${x}" y="${430 - h}" width="40" height="${h}" ${stroke(i === 0 ? G.ink : G.mute, 2)}/>
          <line x1="${x - 8}" y1="${430 - h}" x2="${x + 48}" y2="${430 - h}" ${stroke(i === 0 ? G.ink : G.mute, 2)}/>
          ${[0.33, 0.66].map((f) => `<line x1="${x + 40 * f}" y1="${436 - h}" x2="${x + 40 * f}" y2="424" ${stroke(G.line2, 1.5)}/>`).join("")}
          ${mono(x + 20, 462, String(i + 1).padStart(2, "0"), G.mute, 13, "middle")}`;
      })
      .join("");
    return `<line x1="40" y1="430" x2="480" y2="430" ${stroke(G.mute, 2)}/>${cols}
      <line x1="260" y1="70" x2="260" y2="150" ${stroke(G.ink2, 2)}/><line x1="150" y1="90" x2="370" y2="90" ${stroke(G.ink2, 2)}/>
      <path d="M150 90 L128 140 L172 140 Z" ${stroke(G.ink2, 1.5)}/><path d="M370 90 L348 140 L392 140 Z" ${stroke(G.ink2, 1.5)}/>
      <circle cx="260" cy="70" r="7" fill="${G.ink}"/>`;
  },
  noise: () => {
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const cells = [];
    for (let y = 0; y < 14; y++)
      for (let x = 0; x < 14; x++) {
        const v = rnd();
        if (v > 0.55) cells.push(`<rect x="${76 + x * 26}" y="${60 + y * 26}" width="${v > 0.9 ? 22 : 10}" height="${v > 0.9 ? 22 : 10}" fill="${v > 0.93 ? G.ink : v > 0.75 ? G.mute : G.line2}"/>`);
      }
    return `<rect x="66" y="50" width="388" height="388" rx="18" ${stroke(G.mute, 2)}/>${cells.join("")}
      <path d="M40 470 ${Array.from({ length: 22 }, (_, i) => `L${60 + i * 20} ${470 + (i % 2 ? -1 : 1) * (6 + rnd() * 18)}`).join(" ")}" ${stroke(G.ink2, 2)}/>
      ${mono(66, 34, "SCROLL · SCROLL · SCROLL", G.mute, 13)}`;
  },
  crescent: () => `
      <path d="M300 70 A140 140 0 1 0 420 290 A112 112 0 1 1 300 70 Z" fill="${G.ink}"/>
      <path d="M400 110 l7 18 19 1 -15 12 5 19 -16 -11 -16 11 5 -19 -15 -12 19 -1 Z" fill="${G.ink2}"/>
      <g transform="translate(150 300) rotate(45)">
        <rect x="-62" y="-62" width="124" height="124" ${stroke(G.mute, 2)}/>
        ${[-31, 0, 31].map((d) => `<line x1="${d}" y1="-62" x2="${d}" y2="62" ${stroke(G.line2, 1.5)}/><line x1="-62" y1="${d}" x2="62" y2="${d}" ${stroke(G.line2, 1.5)}/>`).join("")}
      </g>
      <line x1="150" y1="212" x2="150" y2="150" ${stroke(G.mute, 1.5)}/>
      <path d="M150 388 q-12 40 -30 70 M150 388 q12 40 30 70" ${stroke(G.mute, 1.5)}/>
      <line x1="40" y1="480" x2="480" y2="480" ${stroke(G.line2, 1.5)}/>`,
  night: () => `
      ${Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 131) % 480 + 20}" cy="${(i * 73) % 300 + 20}" r="${i % 6 ? 1.3 : 2.4}" fill="${i % 7 ? G.mute : G.ink2}"/>`).join("")}
      <path d="M150 60 A70 70 0 1 0 210 170 A56 56 0 1 1 150 60 Z" fill="${G.ink}"/>
      <path d="M390 120 l4 26 26 4 -26 4 -4 26 -4 -26 -26 -4 26 -4 Z" fill="${G.ink}"/>
      <circle cx="390" cy="150" r="40" ${stroke(G.line2, 1.5)}/>
      <path d="M180 470 L180 400 A80 80 0 0 1 340 400 L340 470" ${stroke(G.mute, 2)}/>
      <line x1="260" y1="320" x2="260" y2="296" ${stroke(G.mute, 2)}/><circle cx="260" cy="290" r="5" ${stroke(G.mute, 2)}/>
      <rect x="140" y="410" width="20" height="60" ${stroke(G.mute, 2)}/><rect x="360" y="410" width="20" height="60" ${stroke(G.mute, 2)}/>
      <line x1="20" y1="470" x2="500" y2="470" ${stroke(G.mute, 2)}/>`,
  branches: () => {
    const main = [70, 150, 230, 310, 390, 470];
    return `
      <line x1="120" y1="40" x2="120" y2="490" ${stroke(G.mute, 3)}/>
      <path d="M120 150 C120 190 260 190 260 230 L260 330 C260 370 120 370 120 410" ${stroke(G.ink2, 3)}/>
      ${main.map((y) => `<circle cx="120" cy="${y}" r="11" fill="${G.bg}" ${stroke(G.mute, 3)}/>`).join("")}
      <circle cx="260" cy="250" r="11" fill="${G.bg}" ${stroke(G.ink2, 3)}/><circle cx="260" cy="310" r="11" fill="${G.ink}"/>
      <circle cx="120" cy="410" r="14" fill="${G.ink}"/>
      ${mono(150, 76, "docs(readme): update setup", G.mute, 14)}
      ${mono(290, 256, "feat(auth): add login", G.ink2, 14)}
      ${mono(290, 316, "fix(auth): handle expiry", G.ink, 14)}
      ${mono(150, 416, "merge: auth into main", G.ink2, 14)}
      ${mono(150, 476, "chore(deps): bump", G.mute, 14)}`;
  },
  threshold: () => {
    const pts = [40, 300, 80, 280, 120, 290, 160, 230, 200, 250, 240, 180, 280, 150, 320, 150, 360, 150, 400, 210, 440, 190, 480, 230];
    const d = pts.reduce((acc, v, i) => acc + (i % 2 ? `${v} ` : `${i ? "L" : "M"}${v} `), "");
    return `
      ${[100, 180, 260, 340].map((y) => `<line x1="40" y1="${y}" x2="480" y2="${y}" ${stroke(G.line, 1.5)}/>`).join("")}
      <path d="${d} L480 400 L40 400 Z" fill="${G.line}"/>
      <path d="${d}" ${stroke(G.ink2, 3)}/>
      <line x1="40" y1="150" x2="480" y2="150" ${stroke(G.ink, 2)} stroke-dasharray="10 8"/>
      ${mono(480, 136, "LIMIT", G.ink, 14, "end")}
      <rect x="276" y="138" width="96" height="24" fill="${G.bg}"/><line x1="280" y1="150" x2="368" y2="150" ${stroke(G.ink, 5)}/>
      <line x1="40" y1="400" x2="480" y2="400" ${stroke(G.mute, 2)}/>
      ${["00", "06", "12", "18", "24"].map((t, i) => mono(40 + i * 110, 428, t, G.mute, 13, "middle")).join("")}
      <rect x="40" y="452" width="200" height="34" rx="6" ${stroke(G.mute, 1.5)}/>${mono(56, 474, "status: online", G.ink2, 14)}`;
  },
  matrix: () => `
      <rect x="60" y="40" width="420" height="420" ${stroke(G.mute, 2)}/>
      <line x1="270" y1="40" x2="270" y2="460" ${stroke(G.line2, 2)}/><line x1="60" y1="250" x2="480" y2="250" ${stroke(G.line2, 2)}/>
      <rect x="270" y="40" width="210" height="210" fill="${G.line}"/>
      <circle cx="380" cy="130" r="36" fill="${G.ink}"/><circle cx="320" cy="200" r="16" ${stroke(G.ink2, 2.5)}/>
      <circle cx="160" cy="140" r="24" ${stroke(G.ink2, 2.5)}/><circle cx="380" cy="350" r="14" ${stroke(G.mute, 2.5)}/>
      <circle cx="140" cy="360" r="9" fill="${G.mute}"/><circle cx="200" cy="400" r="6" fill="${G.line2}"/>
      ${mono(375, 74, "DO FIRST", G.ink, 13, "middle")}${mono(165, 74, "SCHEDULE", G.mute, 13, "middle")}
      ${mono(375, 290, "DELEGATE", G.mute, 13, "middle")}${mono(165, 290, "DROP", G.mute, 13, "middle")}
      ${mono(270, 494, "URGENCY →", G.mute, 13, "middle")}`,
  steps: () => `
      <path d="M40 470 H140 V390 H240 V310 H340 V230 H440 V150" ${stroke(G.mute, 3)}/>
      ${[[90, 470], [190, 390], [290, 310], [390, 230]].map(([x, y], i) => `<circle cx="${x}" cy="${y - 22}" r="12" ${i === 3 ? `fill="${G.ink2}"` : stroke(G.mute, 2.5)}/>${mono(x, y + 28, ["BEGIN", "INTER", "EXPERT", "OPS"][i], G.mute, 12, "middle")}`).join("")}
      <path d="M440 96 L500 120 L440 144 L380 120 Z" fill="${G.ink}"/>
      <path d="M410 132 V160 Q440 176 470 160 V132" ${stroke(G.ink, 3)}/>
      <line x1="500" y1="120" x2="500" y2="166" ${stroke(G.ink2, 2)}/><circle cx="500" cy="170" r="5" fill="${G.ink2}"/>
      ${Array.from({ length: 12 }, (_, i) => `<circle cx="${60 + (i % 6) * 22}" cy="${80 + Math.floor(i / 6) * 22}" r="5" fill="${i < 9 ? G.ink2 : G.line2}"/>`).join("")}`,
  browser: () => `
      <rect x="40" y="50" width="440" height="400" rx="14" ${stroke(G.mute, 2)}/>
      <line x1="40" y1="96" x2="480" y2="96" ${stroke(G.line2, 2)}/>
      ${[70, 94, 118].map((x) => `<circle cx="${x}" cy="73" r="6" ${stroke(G.mute, 2)}/>`).join("")}
      <rect x="150" y="62" width="300" height="22" rx="11" ${stroke(G.line2, 1.5)}/>
      ${[["FRONTEND", 130, G.ink], ["API", 210, G.ink2], ["DATA", 290, G.mute], ["DEPLOY", 370, G.mute]].map(([label, y, c], i) => `<rect x="${90 + i * 14}" y="${y}" width="${340 - i * 28}" height="56" rx="8" ${stroke(c, 2)}/>${mono(110 + i * 14, y + 34, label, c, 14)}`).join("")}`,
  candles: () => {
    const data = [[300, 260, 320, 240], [262, 280, 250, 300], [282, 240, 230, 296], [238, 250, 226, 266], [250, 210, 200, 262], [212, 220, 196, 236], [222, 186, 176, 232], [190, 196, 172, 214]];
    const bars = data
      .map(([o, c, lo, hi], i) => {
        const x = 70 + i * 40;
        const up = c < o;
        return `<line x1="${x}" y1="${lo}" x2="${x}" y2="${hi}" ${stroke(G.mute, 2)}/><rect x="${x - 11}" y="${Math.min(o, c)}" width="22" height="${Math.max(4, Math.abs(o - c))}" ${up ? `fill="${G.ink2}"` : `fill="${G.bg}" ${stroke(G.mute, 2)}`}/>`;
      })
      .join("");
    return `${[120, 200, 280, 360].map((y) => `<line x1="40" y1="${y}" x2="480" y2="${y}" ${stroke(G.line, 1.5)}/>`).join("")}
      <line x1="370" y1="40" x2="370" y2="400" ${stroke(G.line2, 1.5)} stroke-dasharray="4 6"/>
      <path d="M370 190 L480 120 L480 70 L370 170 Z" fill="${G.line}"/>
      <path d="M370 182 L480 96" ${stroke(G.ink, 3)} stroke-dasharray="10 8"/>
      ${bars}
      <line x1="40" y1="400" x2="480" y2="400" ${stroke(G.mute, 2)}/>
      ${mono(375, 430, "FORECAST", G.ink, 13)}${mono(40, 430, "HISTORY", G.mute, 13)}
      <circle cx="455" cy="470" r="26" ${stroke(G.ink2, 2.5)}/>${mono(455, 476, "Au", G.ink, 16, "middle")}`;
  },
  olive: () => `
      <path d="M90 440 C170 380 260 300 420 90" ${stroke(G.mute, 3)}/>
      ${[[150, 395, -30], [200, 352, 20], [240, 318, -40], [285, 270, 25], [320, 228, -45], [360, 180, 20], [395, 130, -50]].map(([x, y, r], i) => `<ellipse cx="${x}" cy="${y}" rx="36" ry="11" transform="rotate(${r} ${x} ${y})" ${i % 3 === 1 ? `fill="${G.ink2}"` : stroke(G.ink2, 2)}/>`).join("")}
      <circle cx="232" cy="352" r="10" fill="${G.ink}"/><circle cx="330" cy="262" r="8" fill="${G.ink}"/>
      <text x="40" y="150" fill="${G.mute}" font-family="Geist Mono" font-size="96">{</text>
      <text x="420" y="480" fill="${G.mute}" font-family="Geist Mono" font-size="96">}</text>
      ${mono(60, 500, "facts, not noise", G.ink2, 15)}`,
  address: () => `
      <rect x="30" y="120" width="460" height="64" rx="32" ${stroke(G.ink2, 2)}/>
      <circle cx="68" cy="152" r="12" ${stroke(G.mute, 2)}/><line x1="76" y1="160" x2="84" y2="168" ${stroke(G.mute, 2)}/>
      <text x="100" y="161" fill="${G.ink}" font-family="Geist Mono" font-size="24">ridwaanhall</text><text x="276" y="161" fill="${G.ink}" font-family="Geist Mono" font-size="24">.com</text>
      <line x1="342" y1="136" x2="342" y2="168" ${stroke(G.ink, 2)}/>
      ${[[".dev", 70, G.mute], [".com", 210, G.ink], [".id", 350, G.mute]].map(([t, x, c]) => `<rect x="${x}" y="250" width="110" height="56" rx="10" ${t === ".com" ? `fill="${G.ink}"` : stroke(c, 2)}/>${mono(x + 55, 285, t, t === ".com" ? G.bg : c, 20, "middle")}`).join("")}
      <path d="M265 184 V250" ${stroke(G.ink2, 2)} stroke-dasharray="4 6"/>
      ${Array.from({ length: 3 }, (_, i) => `<line x1="${110 + i * 140}" y1="350" x2="${170 + i * 140}" y2="350" ${stroke(G.line2, 2)}/>`).join("")}
      ${mono(260, 420, "one name, chosen once", G.mute, 15, "middle")}`,
  commits: () => `
      ${[["feat", "add contact form", G.ink], ["fix", "trim email input", G.ink2], ["docs", "explain the cache", G.mute], ["refactor", "split the loader", G.mute], ["test", "cover the parser", G.mute], ["chore", "bump deps", G.line2]]
        .map(([t, m, c], i) => {
          const y = 70 + i * 68;
          return `<circle cx="70" cy="${y}" r="9" ${i === 0 ? `fill="${G.ink}"` : stroke(c, 2.5)}/>${i < 5 ? `<line x1="70" y1="${y + 9}" x2="70" y2="${y + 59}" ${stroke(G.line2, 2)}/>` : ""}
            <rect x="100" y="${y - 17}" width="${t.length * 11 + 22}" height="32" rx="6" ${i === 0 ? `fill="${G.ink}"` : stroke(c, 1.5)}/>
            ${mono(111, y + 5, t, i === 0 ? G.bg : c, 16)}${mono(122 + t.length * 11 + 12, y + 5, m, c, 16)}`;
        })
        .join("")}`,
  versus: () => {
    const col = (x, n, c) => Array.from({ length: n }, (_, i) => [x, 260 + (i - (n - 1) / 2) * 62, c]);
    const left = [...col(60, 4, G.mute), ...col(150, 3, G.ink2)];
    const right = [...col(370, 3, G.ink2), ...col(460, 4, G.mute)];
    const links = (a, b) => a.flatMap(([x1, y1]) => b.map(([x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke(G.line2, 1.2)}/>`)).join("");
    return `${links(left.slice(0, 4), left.slice(4))}${links(right.slice(0, 3), right.slice(3))}
      ${[...left, ...right].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="15" fill="${G.bg}" ${stroke(c, 2.5)}/>`).join("")}
      <line x1="260" y1="60" x2="260" y2="200" ${stroke(G.line2, 1.5)}/><line x1="260" y1="320" x2="260" y2="460" ${stroke(G.line2, 1.5)}/>
      <circle cx="260" cy="260" r="40" fill="${G.ink}"/>${mono(260, 268, "VS", G.bg, 22, "middle")}
      ${mono(105, 490, "PyTorch", G.ink2, 16, "middle")}${mono(415, 490, "TensorFlow", G.ink2, 16, "middle")}`;
  },
  layers: () => `
      ${[["models.py", 330, G.mute], ["views.py", 250, G.ink2], ["templates/", 170, G.ink]].map(([t, y, c]) => `<path d="M260 ${y - 50} L460 ${y} L260 ${y + 50} L60 ${y} Z" fill="${G.bg}" ${stroke(c, 2.5)}/>${mono(260, y + 6, t, c, 16, "middle")}`).join("")}
      <path d="M60 330 V360 L260 410 L460 360 V330" ${stroke(G.mute, 2)}/>
      ${mono(260, 470, "M · T · V", G.mute, 15, "middle")}
      <rect x="380" y="40" width="110" height="40" rx="8" ${stroke(G.ink2, 1.5)}/>${mono(435, 66, "admin/", G.ink2, 14, "middle")}`,
  network: () => {
    const layer = (x, n) => Array.from({ length: n }, (_, i) => [x, 260 + (i - (n - 1) / 2) * 70]);
    const ls = [layer(60, 5), layer(190, 4), layer(320, 4), layer(450, 2)];
    let links = "";
    for (let l = 0; l < ls.length - 1; l++)
      for (const [x1, y1] of ls[l]) for (const [x2, y2] of ls[l + 1]) links += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${stroke(G.line2, 1.2)}/>`;
    const nodes = ls.flatMap((layerNodes, l) => layerNodes.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="16" ${l === 3 && i === 0 ? `fill="${G.ink}"` : `fill="${G.bg}" ${stroke(l === 0 ? G.mute : G.ink2, 2.5)}`}/>`)).join("");
    return `${links}<path d="M190 120 L320 190 L450 225" ${stroke(G.ink, 2.5)}/>${nodes}
      ${mono(60, 470, "INPUT", G.mute, 13, "middle")}${mono(255, 470, "HIDDEN", G.mute, 13, "middle")}${mono(450, 470, "OUTPUT", G.ink, 13, "middle")}`;
  },
  terminal: () => `
      <rect x="30" y="80" width="460" height="340" rx="14" ${stroke(G.mute, 2)}/>
      <line x1="30" y1="122" x2="490" y2="122" ${stroke(G.line2, 2)}/>
      ${[58, 80, 102].map((x) => `<circle cx="${x}" cy="101" r="6" ${stroke(G.mute, 2)}/>`).join("")}
      ${mono(260, 106, "python3", G.mute, 13, "middle")}
      ${mono(56, 170, "&gt;&gt;&gt; name = \"world\"", G.ink2, 19)}
      ${mono(56, 210, "&gt;&gt;&gt; print(f\"hello, {name}\")", G.ink2, 19)}
      ${mono(56, 250, "hello, world", G.ink, 19)}
      ${mono(56, 290, "&gt;&gt;&gt; ", G.ink2, 19)}<rect x="104" y="274" width="12" height="22" fill="${G.ink}"/>
      <path d="M190 470 c0 -30 20 -40 50 -40 h40 c30 0 50 10 50 40" ${stroke(G.line2, 2)}/>`,
  clock: () => {
    const seg = (from, to, r, c, w) => {
      const p = (a) => [260 + r * Math.sin((Math.PI * a) / 180), 260 - r * Math.cos((Math.PI * a) / 180)];
      const [x1, y1] = p(from);
      const [x2, y2] = p(to);
      return `<path d="M${x1} ${y1} A${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${x2} ${y2}" ${stroke(c, w)}/>`;
    };
    return `<circle cx="260" cy="260" r="200" ${stroke(G.line2, 2)}/>
      ${seg(4, 146, 220, G.ink, 10)}${seg(154, 176, 220, G.mute, 10)}${seg(184, 326, 220, G.ink2, 10)}${seg(334, 356, 220, G.mute, 10)}
      ${Array.from({ length: 12 }, (_, i) => {
        const a = (Math.PI * i) / 6;
        return `<line x1="${260 + 172 * Math.sin(a)}" y1="${260 - 172 * Math.cos(a)}" x2="${260 + 190 * Math.sin(a)}" y2="${260 - 190 * Math.cos(a)}" ${stroke(G.mute, i % 3 ? 2 : 4)}/>`;
      }).join("")}
      <line x1="260" y1="260" x2="260" y2="128" ${stroke(G.ink, 5)}/><line x1="260" y1="260" x2="352" y2="300" ${stroke(G.ink2, 4)}/>
      <circle cx="260" cy="260" r="10" fill="${G.ink}"/>
      ${mono(260, 500, "FOCUS 25 · BREAK 5", G.mute, 14, "middle")}`;
  },
};

/* What each post is drawn as, and how the drawing is described to a reader
   who cannot see it. A post with no entry gets the network. */
const MOTIF = {
  "mlbbronedev-and-pddiktironedev-remain-online-with-memory-usage-threshold": ["gauge", "a memory gauge with its needle just inside the threshold, above two servers"],
  "what-is-an-exoplanet-a-tale-from-beyond-our-sky": ["orbit", "a star with orbits around it and a planet crossing in front, over a light curve dipping as it passes"],
  "top-6-asian-countries-with-better-governance-and-religious-harmony": ["pillars", "six numbered pillars of different heights under a balance"],
  "whats-good-with-brainrot-in-2025": ["noise", "a screen of scattered pixels above a jagged line"],
  "eid-al-fitr-celebrating-the-prophets-way": ["crescent", "a crescent moon and star beside a hanging woven ketupat"],
  "why-lailatul-qadr-is-the-ultimate-night-of-blessings": ["night", "a crescent and one bright star in a night sky above a mosque doorway"],
  "commit-message-style-guide": ["branches", "a branch graph of commits, each labelled with a type, scope and summary"],
  "how-usage-monitoring-sustains-mlbb-and-api-pddikti": ["threshold", "a usage chart held under a dashed limit line, with an online status"],
  "project-priority-what-it-is-and-how-to-master-it": ["matrix", "a two-by-two priority matrix with the largest dot in the do-first quadrant"],
  "coding-camp-building-future-ready-talent-with-dbs-foundation": ["steps", "four steps from beginner to ops, ending in a graduation cap"],
  "complete-guide-to-modern-web-development-in-2025": ["browser", "a browser window holding stacked frontend, API, data and deploy layers"],
  "predicting-gold-prices-in-indonesia-ais-golden-touch": ["candles", "a candlestick chart of gold prices continuing into a dashed forecast"],
  "why-im-coding-for-gazas-truth": ["olive", "an olive branch between two code braces"],
  "how-i-picked-the-perfect-domain-for-my-site": ["address", "an address bar reading ridwaanhall.com above the choices .dev, .com and .id"],
  "nail-your-git-game-with-conventional-commits": ["commits", "a list of commits tagged feat, fix, docs, refactor, test and chore"],
  "pytorch-vs-tensorflow-pick-your-ai-fight-club": ["versus", "two small neural networks facing each other, PyTorch against TensorFlow"],
  "whipping-up-web-apps-with-djangos-magic": ["layers", "Django's models, views and templates as three stacked layers"],
  "neural-nets-made-easy-with-tensorflow-keras": ["network", "a neural network of input, hidden and output layers with one path traced through it"],
  "python-101-your-chill-guide-to-getting-started": ["terminal", "a Python prompt printing hello, world"],
  "hacking-your-dev-life-time-management-tricks": ["clock", "a clock face divided into focus and break periods"],
};

const esc = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function page(post, motif) {
  // A draft has no date worth printing: its `published_at` is a placeholder
  // until it goes out, and a cover outlives that moment.
  const date = post.isPublished
    ? new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(post.publishedAt))
    : "";
  const size = post.title.length > 62 ? 64 : post.title.length > 40 ? 76 : 88;
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@500;600&family=Geist:wght@400;500&family=Geist+Mono:wght@400;500&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { width: ${W}px; height: ${H}px; background: ${G.bg}; color: ${G.ink}; font-family: Geist, sans-serif; overflow: hidden; position: relative; }
  .grid { position: absolute; inset: 0; background-image: linear-gradient(${G.line} 1px, transparent 1px), linear-gradient(90deg, ${G.line} 1px, transparent 1px); background-size: 80px 80px; background-position: -1px -1px; opacity: .55; }
  .fade { position: absolute; inset: 0; background: radial-gradient(ellipse 70% 90% at 30% 50%, ${G.bg} 35%, transparent 100%); }
  .frame { position: absolute; inset: 56px 150px; border-top: 1px solid ${G.line2}; border-bottom: 1px solid ${G.line2}; }
  .text { position: absolute; left: 150px; top: 56px; bottom: 56px; width: 760px; display: flex; flex-direction: column; justify-content: space-between; padding: 34px 0; }
  .top, .bottom { font-family: "Geist Mono", monospace; font-size: 20px; color: ${G.mute}; display: flex; gap: 14px; align-items: center; letter-spacing: .02em; }
  .tag { border: 1px solid ${G.line2}; border-radius: 6px; padding: 5px 12px; color: ${G.ink2}; }
  h1 { font-family: "Funnel Display", sans-serif; font-weight: 600; font-size: ${size}px; line-height: 1.02; letter-spacing: -.03em; color: ${G.ink}; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .lead { margin-top: 26px; font-size: 26px; line-height: 1.4; color: ${G.ink2}; max-width: 700px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .dot { width: 6px; height: 6px; background: ${G.mute}; border-radius: 50%; }
  .name { color: ${G.ink}; }
  .art { position: absolute; right: 150px; top: 160px; width: 520px; height: 520px; }
</style></head><body>
<div class="grid"></div><div class="fade"></div><div class="frame"></div>
<div class="text">
  <div class="top"><span class="tag">${esc(post.category || "Writing")}</span><span>ridwaanhall.com/blog</span></div>
  <div><h1>${esc(post.title)}</h1><p class="lead">${esc(post.description)}</p></div>
  <div class="bottom"><span class="name">Ridwan Halim</span>${date ? `<span class="dot"></span><span>${date}</span>` : ""}${post.readTime ? `<span class="dot"></span><span>${post.readTime} min read</span>` : ""}</div>
</div>
<svg class="art" viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg">${DRAW[motif]()}</svg>
</body></html>`;
}

const posts = await db
  .select({
    id: blogPost.id,
    slug: blogPost.slug,
    title: blogPost.title,
    description: blogPost.description,
    publishedAt: blogPost.publishedAt,
    readTime: blogPost.readTime,
    isPublished: blogPost.isPublished,
    category: category.label,
  })
  .from(blogPost)
  .leftJoin(category, eq(category.id, blogPost.categoryId))
  .orderBy(asc(blogPost.publishedAt));

const chosen = posts.filter((post) => !ONLY || post.slug === ONLY);
if (!chosen.length) {
  console.error(ONLY ? `No post with the slug ${ONLY}.` : "No posts.");
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const tab = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const replaced = [];

try {
  for (const post of chosen) {
    const [motif, drawing] = MOTIF[post.slug] ?? ["network", "a small neural network"];
    await tab.setContent(page(post, motif), { waitUntil: "networkidle" });
    await tab.evaluate(() => document.fonts.ready);
    const png = await tab.screenshot({ type: "png" });
    const file = join(OUT, `${post.slug}.png`);
    writeFileSync(file, png);
    const alt = `Cover for “${post.title}”: ${drawing}, drawn in grey lines on black.`;
    console.log(`${APPLY ? "upload" : "drew"}  ${file}`);

    if (!APPLY) continue;
    const key = objectKeyFor("blog", `${post.slug}-cover.png`, png);
    if (!key.ok) throw new Error(key.error);
    await putObject(key.key, png, key.contentType);

    const [existing] = await db.select({ id: mediaAsset.id }).from(mediaAsset).where(eq(mediaAsset.storageKey, key.key)).limit(1);
    const mediaId =
      existing?.id ??
      (await db.insert(mediaAsset).values({ storageKey: key.key, source: "storage", originalFilename: key.key.split("/").pop() ?? "", alt }).returning({ id: mediaAsset.id }))[0].id;
    await db.update(mediaAsset).set({ alt }).where(eq(mediaAsset.id, mediaId));

    const old = await db
      .select({ key: mediaAsset.storageKey, mediaId: blogImage.mediaId })
      .from(blogImage)
      .innerJoin(mediaAsset, eq(mediaAsset.id, blogImage.mediaId))
      .where(eq(blogImage.postId, post.id));
    await db.transaction(async (tx) => {
      await tx.delete(blogImage).where(eq(blogImage.postId, post.id));
      await tx.insert(blogImage).values({ postId: post.id, mediaId, position: 0 });
    });
    replaced.push(...old.filter((row) => row.mediaId !== mediaId).map((row) => row.key));
  }
} finally {
  await browser.close();
}

if (APPLY && replaced.length) {
  const result = await deleteUnreferenced(replaced, { budgetMs: 120_000 });
  console.log(`old images: ${result.deleted.length} deleted, ${result.kept.length} kept (still used elsewhere), ${result.failed.length} failed`);
  if (result.failed.length) console.log(result.failed.join("\n"));
}
if (APPLY) {
  // So the next request sees the new covers without waiting out the cache.
  console.log("Posts updated. Expire the blog tag (save any post in the admin, or redeploy) to serve them at once.");
}
console.log(`${chosen.length} cover(s) ${APPLY ? "uploaded" : `drawn to ${OUT}; nothing uploaded (pass --apply)`}`);
await pool.end();
