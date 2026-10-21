import { cvRedirect } from "@/lib/api/cv-redirect";

export function GET() {
  return cvRedirect();
}
