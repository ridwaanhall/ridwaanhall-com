import { handle, ok } from "@/lib/api/response";
import { getLegalDocuments } from "@/lib/data/legal";

export const GET = handle(async () => ok(await getLegalDocuments()));
