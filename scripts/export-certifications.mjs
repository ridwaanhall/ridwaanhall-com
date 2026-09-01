/**
 * Write every certification in the database to a file.
 *
 * A restore point, taken before `scripts/import-certifications.mjs` adds a
 * hundred rows. There is no local database and no fixtures here -- every read
 * and every write in this repository is against the live Supabase project -- so
 * the thing standing between a bad import and a lost record is a copy taken
 * first, by hand, on purpose.
 *
 * It is written to be enough on its own. Each certification carries the *name
 * and slug* of its organization rather than only the foreign key, and its
 * achievement rows travel with it, so somebody restoring from this file does not
 * also need a matching dump of `organization` to know what `organization_id`
 * pointed at.
 *
 * **`certifications.dump.json`, and the name is doing work.** `.gitignore`
 * matches `*.dump.json`, so a database dump written here cannot be committed by
 * accident -- which is the entire reason that rule exists. Renaming the output
 * without checking that rule is how a dump ends up in the history.
 *
 * Reads only. Run it as often as you like.
 *
 *   npx tsx --conditions=react-server scripts/export-certifications.mjs [file]
 */
import { writeFileSync } from "node:fs";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const OUT = process.argv[2] ?? "certifications.dump.json";

const { db, pool } = await import("../lib/db/client.ts");
const { certification, certificationAchievement, organization } = await import(
  "../lib/db/app-schema.ts"
);
const { asc, desc, eq } = await import("drizzle-orm");

const rows = await db
  .select({
    id: certification.id,
    title: certification.title,
    issued: certification.issued,
    credentialUrl: certification.credentialUrl,
    isFeatured: certification.isFeatured,
    organizationId: certification.organizationId,
    organizationName: organization.name,
    organizationSlug: organization.slug,
  })
  .from(certification)
  .innerJoin(organization, eq(certification.organizationId, organization.id))
  // The order the site reads them in, so the file and the page agree.
  .orderBy(desc(certification.isFeatured), desc(certification.issued));

const achievements = await db
  .select({
    certificationId: certificationAchievement.certificationId,
    body: certificationAchievement.body,
    position: certificationAchievement.position,
  })
  .from(certificationAchievement)
  .orderBy(asc(certificationAchievement.position));

const byCertification = new Map();
for (const row of achievements) {
  const list = byCertification.get(row.certificationId) ?? [];
  list.push({ body: row.body, position: row.position });
  byCertification.set(row.certificationId, list);
}

const dump = {
  /*
   * Stamped so two dumps can be told apart, and so a file found later says when
   * it was true. `exportedAt` is the only value here that is not from the
   * database, and it is deliberately not part of any row.
   */
  exportedAt: new Date().toISOString(),
  source: "app.certification",
  count: rows.length,
  certifications: rows.map((row) => ({
    ...row,
    achievements: byCertification.get(row.id) ?? [],
  })),
};

writeFileSync(OUT, `${JSON.stringify(dump, null, 2)}\n`, "utf8");

const withAchievements = dump.certifications.filter((row) => row.achievements.length > 0).length;
console.log(
  `\nWrote ${OUT}\n` +
    `  ${rows.length} certification(s), ` +
    `${achievements.length} achievement(s) across ${withAchievements} of them\n` +
    `  ${new Set(rows.map((row) => row.organizationName)).size} organization(s) named\n`,
);

await pool.end();
