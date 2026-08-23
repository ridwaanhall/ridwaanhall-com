"use client";

import { Toaster } from "sonner";

/**
 * The site's one notification surface.
 *
 * **Mounted at body level, outside `#page-content`.** That element animates a
 * `translateY`, and a transformed ancestor becomes the containing block for its
 * `position: fixed` descendants -- a stack inside it would be positioned
 * against the content column rather than the viewport.
 * `scripts/check-notifications.mjs` asserts exactly this structurally, because
 * nothing else would catch it.
 *
 * Geometry: 4px in from the top, centred and full
 * width on a phone, right-aligned and 384px (`sm:w-96`) from `sm` up, at most
 * four at once, oldest dropped first so a burst of errors cannot push the
 * newest off-screen.
 *
 * `z-[60]`, above the confirm dialog's `z-50`: a toast raised while the dialog
 * is open -- a failed action, say -- has to be readable over it.
 *
 * Every toast is rendered by `<Toast>` through `notify()`, so sonner supplies
 * only the machinery `notify.js` hand-rolled (the timers, the hover hold, the
 * stacking and its enter/exit) and none of the appearance. `toastOptions.
 * unstyled` is what keeps sonner's own palette out of it.
 */
export function Notifications() {
  return (
    <Toaster
      position="top-right"
      visibleToasts={4}
      offset={16}
      mobileOffset={16}
      gap={8}
      // `expand`, because the original showed every toast at full size in a
      // plain column. Sonner's default collapses the stack into a scaled deck
      // that only opens on hover, which hides three of the four -- and the
      // reason four are allowed at all is that a burst of errors should be
      // readable, not merely present.
      expand
      toastOptions={{ unstyled: true, classNames: { toast: "w-full" } }}
      // 384px is the original's `sm:w-96`. Sonner's own default is 356.
      // Below 600px it uses its mobile width instead, `calc(100% - 32px)`,
      // which is exactly what `inset-x-0 px-4` gave -- 343px at 375.
      style={{ zIndex: 60, "--width": "384px" } as React.CSSProperties}
      // Sonner's own aria-live region announces each toast; the `sr-only`
      // variant word inside `<Toast>` is what tells a reader which kind it is.
      containerAriaLabel="Notifications"
    />
  );
}
