/**
 * How the public site's pictures are resized, and the one URL shape that needs
 * building.
 *
 * Three answers, chosen on the admin's Site settings screen:
 *
 * - `none`: the original file, as uploaded. Nothing transforms it, so nothing
 *   is billed for it; a large upload is a large download.
 * - `next`: Next's own optimizer at `/_next/image`. Best-fitting sizes and
 *   formats, at the cost of the host's image-transformation quota -- which is
 *   the reason the choice exists.
 * - `wsrv`: the wsrv.nl image proxy, which fetches the original from storage
 *   and returns a resized WebP. It costs this site nothing, and it depends on
 *   somebody else's service being up.
 *
 * A plain module: the page reads it on the server and the image component
 * reads it in the browser, and a constant exported from a `"use client"`
 * module reaches the server as a reference rather than as the value.
 */
export const IMAGE_SERVICES = ["none", "next", "wsrv"] as const;
export type ImageService = (typeof IMAGE_SERVICES)[number];

export type ImageSettings = { service: ImageService; quality: number };

/** What the site did before the setting existed. */
export const DEFAULT_IMAGE_SETTINGS: ImageSettings = { service: "next", quality: 80 };

export const MIN_IMAGE_QUALITY = 40;
export const MAX_IMAGE_QUALITY = 100;

/**
 * The qualities Next's optimizer is allowed to produce. Next 16 requires the
 * list and coerces anything else to the closest entry, so the setting is
 * snapped here instead and the console stays quiet. `next.config.ts` carries
 * the same list under `images.qualities`; it cannot import this file.
 */
export const NEXT_QUALITIES = [50, 60, 70, 75, 80, 85, 90, 100];

export const WSRV_ORIGIN = "https://wsrv.nl";

/** The closest quality Next's optimizer will actually serve. */
export function nearestNextQuality(quality: number): number {
  return NEXT_QUALITIES.reduce((best, candidate) => (Math.abs(candidate - quality) < Math.abs(best - quality) ? candidate : best));
}

/** What a stored row means, whatever shape it is in: the defaults fill whatever is missing or wrong. */
export function parseImageSettings(row: { imageService?: string | null; imageQuality?: number | null } | null | undefined): ImageSettings {
  const service = IMAGE_SERVICES.find((candidate) => candidate === row?.imageService) ?? DEFAULT_IMAGE_SETTINGS.service;
  const quality = Number(row?.imageQuality);
  return {
    service,
    quality: Number.isFinite(quality) && quality >= MIN_IMAGE_QUALITY && quality <= MAX_IMAGE_QUALITY ? Math.round(quality) : DEFAULT_IMAGE_SETTINGS.quality,
  };
}

/**
 * The wsrv.nl address for one width of an image, or `null` when there is
 * nothing for it to fetch.
 *
 * It fetches over the internet, so only an absolute http(s) address will do:
 * a path on this site, or a data URI, is returned to the caller to use as it
 * is. `we` is "without enlargement" -- a 600px original asked for at 1280 is
 * served at 600 rather than blurred up.
 */
export function wsrvUrl(src: string, width: number, quality: number): string | null {
  if (!/^https?:\/\//i.test(src)) return null;
  const params = new URLSearchParams({ url: src, w: String(Math.round(width)), q: String(Math.round(quality)), output: "webp", we: "1" });
  return `${WSRV_ORIGIN}/?${params.toString()}`;
}
