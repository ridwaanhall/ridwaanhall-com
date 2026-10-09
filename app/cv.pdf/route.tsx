import { renderToBuffer } from "@react-pdf/renderer";
import { cacheLife, cacheTag } from "next/cache";

import { CvDocument } from "@/lib/cv/document";
import { getCv } from "@/lib/cv/load";
import { TAGS } from "@/lib/data/tags";

/**
 * The CV as a PDF, generated from the About page.
 *
 * The content is `getCv`, which the Markdown twin at `/cv.md` reads too; this
 * only draws it. It returns base64 because a cache entry must be serialisable,
 * and it is tagged like the content so an edit in the admin produces a new file
 * on the next request.
 */
async function build(): Promise<string | null> {
  "use cache";
  cacheTag(TAGS.profile, TAGS.experience, TAGS.education, TAGS.certification, TAGS.skill, TAGS.project, TAGS.opentowork, TAGS.organization);
  cacheLife("days");

  const loaded = await getCv();
  if (!loaded) return null;
  const buffer = await renderToBuffer(<CvDocument cv={loaded.cv} username={loaded.username} />);
  return buffer.toString("base64");
}

export async function GET() {
  const pdf = await build();
  if (!pdf) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(pdf, "base64"), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="ridwan-halim-cv.pdf"',
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
