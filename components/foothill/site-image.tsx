"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { createContext, useContext, useMemo } from "react";

import { DEFAULT_IMAGE_SETTINGS, nearestNextQuality, wsrvUrl, type ImageSettings } from "@/lib/site/image-service";

const ImageSettingsContext = createContext<ImageSettings>(DEFAULT_IMAGE_SETTINGS);

/**
 * Tells every `SiteImage` below it how pictures are resized. The layout reads
 * the setting once, on the server, and mounts this around the shell.
 */
export function ImageServiceProvider({ settings, children }: { settings: ImageSettings; children: React.ReactNode }) {
  return <ImageSettingsContext.Provider value={settings}>{children}</ImageSettingsContext.Provider>;
}

/**
 * `next/image`, resized by whichever service the Site settings screen chose.
 *
 * - **none**: the file as uploaded, with nothing transforming it.
 * - **next**: Next's optimizer, at the configured quality.
 * - **wsrv**: the same `srcset` and `sizes`, with each width's address built
 *   for wsrv.nl. A source that is not an absolute http(s) address has nothing
 *   for a remote service to fetch, so it is used as it is.
 *
 * This is the only place `next/image` is imported by the public site, so the
 * setting cannot be bypassed by a component that forgot it.
 */
export function SiteImage({ alt, ...props }: ImageProps) {
  const { service, quality } = useContext(ImageSettingsContext);
  const loader = useMemo(
    () =>
      service === "wsrv"
        ? ({ src, width, quality: asked }: ImageLoaderProps) => wsrvUrl(src, width, asked ?? quality) ?? src
        : undefined,
    [service, quality],
  );

  if (service === "none") return <Image alt={alt} {...props} unoptimized />;
  if (loader) return <Image alt={alt} {...props} loader={loader} />;
  return <Image alt={alt} quality={nearestNextQuality(quality)} {...props} />;
}
