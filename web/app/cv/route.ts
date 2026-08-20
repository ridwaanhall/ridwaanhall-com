import { cvRedirect } from "@/lib/api/cv-redirect";

export async function GET() {
  return cvRedirect("main");
}
