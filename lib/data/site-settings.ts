import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import { siteSetting } from "@/lib/db/app-schema";
import { parseImageSettings, type ImageSettings } from "@/lib/site/image-service";

import { TAGS } from "./tags";

/**
 * The site-wide settings the public layout reads, so far how pictures are
 * resized.
 *
 * Read once, in the layout, and handed down as a prop: every page then agrees
 * on it without each asking. A missing row is not an error -- it means the
 * defaults, which are what the site did before the setting existed -- so a
 * fresh database renders correctly before anybody opens the admin.
 */
export async function getImageSettings(): Promise<ImageSettings> {
  "use cache";
  cacheTag(TAGS.settings);
  cacheLife("days");

  const [row] = await db
    .select({ imageService: siteSetting.imageService, imageQuality: siteSetting.imageQuality })
    .from(siteSetting)
    .limit(1);
  return parseImageSettings(row);
}
