import type { Metadata } from "next";

import { PatchNotesPage } from "@/components/foothill/patch-notes";
import { getAboutData } from "@/lib/data/about";
import { getPatchNotes } from "@/lib/data/patch-notes";
import { patchNotesSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(patchNotesSeo(), about);
}

export default async function PatchNotes() {
  return <PatchNotesPage notes={await getPatchNotes()} />;
}
