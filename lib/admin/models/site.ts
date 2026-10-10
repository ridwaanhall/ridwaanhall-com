import { siteSetting } from "@/lib/db/app-schema";
import type { AdminFormModel } from "@/lib/admin/form";
import { IMAGE_SERVICES, MAX_IMAGE_QUALITY, MIN_IMAGE_QUALITY } from "@/lib/site/image-service";

const SERVICE_LABEL: Record<(typeof IMAGE_SERVICES)[number], string> = {
  none: "No resizing: serve the original file",
  next: "Resize with Next.js",
  wsrv: "Resize with wsrv.nl",
};

/**
 * The site's own switches. One row, like the profile: the form *is* the
 * record, so there is no list and nothing to create or delete -- the row is
 * made with the table, and a unique index on a constant refuses a second.
 */
export const siteSettingForm: AdminFormModel = {
  key: "site-setting",
  from: siteSetting,
  pk: siteSetting.id,
  label: () => "Site settings",
  canCreate: false,
  canDelete: false,
  fieldsets: [
    {
      title: "Images",
      help: "How every picture on the public site is resized before it reaches a reader.",
      fields: [
        {
          name: "imageService",
          column: siteSetting.imageService,
          label: "Resize with",
          kind: "select",
          required: true,
          // The column's own CHECK constraint, spelled out.
          choices: IMAGE_SERVICES.map((value) => ({ value, label: SERVICE_LABEL[value] })),
          help: "Next.js resizes on this site's host and counts against its image-transformation quota. wsrv.nl is a free outside service that fetches the original from storage and returns a smaller WebP, so it costs the host nothing but depends on that service being up. No resizing sends the file exactly as uploaded: nothing is billed, and large uploads load slowly.",
        },
        {
          name: "imageQuality",
          column: siteSetting.imageQuality,
          label: "Quality",
          kind: "number",
          required: true,
          min: MIN_IMAGE_QUALITY,
          max: MAX_IMAGE_QUALITY,
          help: `From ${MIN_IMAGE_QUALITY} to ${MAX_IMAGE_QUALITY}. Lower is smaller and softer. Ignored when resizing is off; Next.js rounds it to the nearest of 50, 60, 70, 75, 80, 85, 90 or 100.`,
        },
      ],
    },
  ],
};
