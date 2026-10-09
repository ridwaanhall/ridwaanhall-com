import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * The sharing card: 1200 by 630, in the site's own faces and greys.
 *
 * One layout for every kind of page, so a link pasted into X, WhatsApp,
 * LinkedIn or Slack looks like the site it leads to: the address top left,
 * the page's title large, its lead under it in grey, the name at the foot.
 * Black and white and the greys between, as the site is. A project or a post
 * keeps its own cover image instead; these are for the pages that have none.
 *
 * The faces are read from files in `node_modules`, which `ImageResponse`
 * needs as bytes -- `next/font` produces CSS, not a file it can take. Cached
 * with the route: the card is generated once and served as a static image.
 */
const font = (pkg: string, file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", pkg, "files", file));

export const OG_SIZE = { width: 1200, height: 630 };

export async function card({ title, lead }: { title: string; lead?: string }) {
  const [display, text] = await Promise.all([font("funnel-display", "funnel-display-latin-500-normal.woff"), font("geist", "geist-latin-400-normal.woff")]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000000",
          color: "#f4f4f4",
          padding: "64px 72px",
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: "#8f8f8f" }}>
          <span style={{ fontFamily: "Funnel Display", fontSize: 30, color: "#f4f4f4" }}>ridwaanhall</span>
          <span>ridwaanhall.com</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Funnel Display", fontSize: title.length > 32 ? 92 : 112, lineHeight: 0.98, letterSpacing: -4, maxWidth: 1000 }}>{title}</div>
          {lead && <div style={{ marginTop: 32, fontSize: 32, lineHeight: 1.35, color: "#8f8f8f", maxWidth: 900 }}>{lead}</div>}
        </div>
        <div style={{ display: "flex", borderTop: "1px solid #333333", paddingTop: 22, fontSize: 24, color: "#8f8f8f" }}>
          Ridwan Halim, full stack developer and AI/ML engineer
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Funnel Display", data: display, style: "normal", weight: 500 },
        { name: "Geist", data: text, style: "normal", weight: 400 },
      ],
    },
  );
}
