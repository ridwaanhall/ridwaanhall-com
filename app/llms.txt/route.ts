import { llmsIndex } from "@/lib/markdown/index-file";
import { plain } from "@/lib/markdown/respond";

/** The index of every page, for language models. See `lib/markdown/index-file.ts`. */
export async function GET() {
  return plain(await llmsIndex());
}
