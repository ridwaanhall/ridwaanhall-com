import type { Route } from "next";
import { redirect } from "next/navigation";

import { CV_FILE } from "@/lib/site/cv";

/**
 * The old CV addresses (/cv, /cv-latest, /cv-copy), sent to the generated CV.
 *
 * They used to redirect to the three documents stored on the profile -- a PDF
 * and a Google Doc on Drive, both written by hand -- which no edit in the admin
 * could reach. So the experience was updated, the About page showed it, and
 * every shared CV link still opened last year's file. The addresses stay
 * because they are in people's inboxes; what they lead to is now the one CV
 * that is built from About and therefore cannot fall behind it.
 */
export function cvRedirect(): never {
  redirect(CV_FILE as Route);
}
