import Image from "next/image";

/**
 * Profile photo.
 *
 * Rendered in two places -- the navbar and the mobile drawer -- which is why
 * `size` is a prop: the placements are genuinely different contexts, not an
 * inconsistency to normalise away.
 *
 * It carries **no status dot**. An amber pulsing `is_sick` badge and a green
 * `is_active` one used to sit in the bottom-right corner; both were removed
 * because the pulse pulled the eye off the name beside it. Both states are
 * still stated in words by the status badges under the username, so nothing is
 * lost. Don't add it back without asking.
 *
 * `eager` marks the copy that is above the fold. That is the navbar's, at every
 * width: the drawer's is behind a closed panel and stays lazy.
 *
 * It sets `loading="eager"`, which replaces the `priority` prop Next 16
 * deprecated and is what Next names when it reports an image as the Largest
 * Contentful Paint.
 *
 * Not Next's `preload`, which is the stronger form: that calls
 * `ReactDOM.preload` itself and so is guaranteed a `<link>` in the head. It was
 * unavailable while the chrome drew two avatars at once, at different widths and
 * so different optimizer URLs, with no way for the head to know which the
 * viewport would show; one navbar leaves one non-lazy copy, so the option is
 * open now. The heroes still get the guarantee and this takes React's ordinary
 * handling, which is a preload either way -- see below.
 *
 * Which is still a preload, and worth being exact about: React hoists a
 * `<link rel="preload">` for every non-lazy `<img>` it renders on the server,
 * up to ten of them. So this changes which API asks for it, not what the
 * browser ends up fetching.
 */
export function ProfileAvatar({
  src,
  name,
  size = 40,
  className,
  eager = false,
}: {
  src: string;
  name: string;
  /** Rendered pixel size; also the intrinsic size requested from the optimizer. */
  size?: number;
  className?: string;
  eager?: boolean;
}) {
  if (!src) {
    // A missing photo must not render a broken image in the navbar.
    return (
      <div
        className={`shrink-0 rounded-full bg-zinc-800 ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={`${name} Profile Photo`}
      width={size}
      height={size}
      loading={eager ? "eager" : "lazy"}
      className={`shrink-0 rounded-full object-cover ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}
