import { llmsFull } from "@/lib/markdown/index-file";
import { plain } from "@/lib/markdown/respond";

/** Every page as Markdown, in one file. See `lib/markdown/index-file.ts`. */
export async function GET() {
  return plain(await llmsFull());
}
