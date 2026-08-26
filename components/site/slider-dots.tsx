"use client";

/**
 * The dot row under a slider: a filled bar for where you are, a small dot for
 * everywhere else.
 *
 * **One definition for all three sliders here** -- the featured posts above the
 * blog listing, and both variants of the image gallery on a post and a project.
 * They used to be three hand-copied class strings, and they had already
 * drifted: a project's active dot carried `sm:w-2` after its `w-4`, so above
 * 640px it stayed exactly the circle its neighbours were and the only thing
 * marking the current image was half a step of opacity. Three copies of a
 * thing that is meant to look the same is how that happens.
 *
 * The active dot is *wider*, not merely brighter, because width is what
 * survives a glance -- and telling you where you are in the set is the whole
 * job of the row.
 *
 * `title` differs per slider because the things being counted do ("Slide 2",
 * "Image 2"), and it is also each button's accessible name: the dot has no
 * text of its own.
 */
export function SliderDots({
  count,
  active,
  onSelect,
  title,
}: {
  count: number;
  /** Index of the slide showing now. */
  active: number;
  onSelect: (index: number) => void;
  /** The button's tooltip and accessible name, from its 1-based position. */
  title: (position: number) => string;
}) {
  return (
    <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-1 sm:space-x-2">
      {Array.from({ length: count }, (_, position) => (
        <button
          key={position}
          type="button"
          onClick={() => onSelect(position)}
          aria-current={position === active}
          className={position === active ? DOT_ACTIVE : DOT_IDLE}
          title={title(position + 1)}
        />
      ))}
    </div>
  );
}

/* The height grows above 640px but the width does not: the active bar is 16px
   wide at every size, which is what makes it read as a bar rather than a
   rounder dot. */
const DOT = "cursor-pointer rounded-full transition-all duration-300 hover:bg-zinc-300";
const DOT_ACTIVE = `${DOT} bg-zinc-300 w-4 h-1.5 sm:h-2`;
const DOT_IDLE = `${DOT} bg-zinc-300/50 w-1.5 h-1.5 sm:h-2`;
