import Image from "next/image";

/**
 * The image frame used by blog posts and projects.
 *
 * A single image gets the "Mac window" frame -- three dots and the filename in
 * a header strip. Several images get the same frame with a scroll-snap row
 * inside it, so swipe, momentum and keyboard scrolling all come from the
 * browser rather than from a slider library.
 *
 * `.gallery-frame` and `.gallery-header` are defined in the bundled stylesheet
 * and shared with the project gallery.
 */
export function MediaGallery({
  images,
  names,
  alt,
  caption,
}: {
  images: string[];
  names: string[];
  alt: string;
  /** Shown under a multi-image gallery. */
  caption?: string;
}) {
  if (images.length === 0) return null;
  const multiple = images.length > 1;

  return (
    <div className="mb-6 md:mb-8">
      <div className="gallery-frame">
        <div className="gallery-header">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-300" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all duration-300" />
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 hover:bg-green-400 transition-all duration-300" />
          </div>
          <span className="ml-auto text-xs hidden sm:block current-filename">
            {names[0] || "blog-image"}
          </span>
        </div>

        {multiple ? (
          <div className="flex w-full snap-x snap-mandatory overflow-x-auto scrollbar-hide">
            {images.map((src, index) => (
              <div key={src} className="relative w-full shrink-0 snap-center">
                <div className="aspect-video" data-lightbox-item>
                  <Image
                    src={src}
                    alt={`${alt} — image ${index + 1} of ${images.length}`}
                    width={1200}
                    height={675}
                    // The first image of a post is usually the largest thing
                    // above the fold, so it is not deferred.
                    priority={index === 0}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="relative w-full">
            <div className="aspect-video" data-lightbox-single>
              <Image
                src={images[0]}
                alt={alt}
                width={1200}
                height={675}
                priority
                className="w-full h-full object-cover object-center"
              />
            </div>
          </div>
        )}
      </div>

      {multiple && (
        <p className="text-sm text-zinc-400 text-center mt-2">
          {caption ?? `${images.length} images • Swipe to navigate`}
        </p>
      )}
    </div>
  );
}
