"use client";

import { useEffect } from "react";

/**
 * Tooltips that work on touch as well as hover.
 *
 * A native `title` only renders on hover, so on a phone every one of them is
 * unreachable. This upgrades them into a positioned chip shown on hover, on
 * keyboard focus, and on tap.
 *
 * **Everything is delegated from the document rather than bound per element.**
 * That is what makes this a single mounted component rather than a wrapper
 * around every trigger: markup that appears later -- gallery controls, lightbox
 * buttons, a tab panel that was hidden -- is covered with no observer, no
 * re-scan and no change here. It is also why `title` stays the authoring
 * convention: a `group-hover` chip is hover-only and therefore invisible on
 * touch, and a Radix-style trigger wrapper would have to be threaded through
 * every site that uses one.
 *
 * Tapping never blocks the trigger: the chip is shown from a plain `click`
 * listener with no preventDefault, so a tooltip on a link or a button still
 * navigates or submits on the same tap that reveals it.
 */

const TAP_VISIBLE_MS = 2000;
/** px between the trigger and the chip. */
const GAP = 8;
/** Minimum px from the viewport edge. */
const EDGE = 8;

export function Tooltips() {
  useEffect(() => {
    let tip: HTMLDivElement | null = null;
    let current: Element | null = null;
    let hideTimer = 0;
    // Recorded on pointerdown because `click` does not carry pointerType.
    // Hybrid laptops then report per-interaction, which is what we want.
    let lastPointerType = "mouse";

    const ensureTip = () => {
      if (tip) return tip;
      tip = document.createElement("div");
      tip.className = "app-tooltip";
      tip.setAttribute("role", "tooltip");
      tip.setAttribute("aria-hidden", "true");
      document.body.appendChild(tip);
      return tip;
    };

    /**
     * Move `title` to `data-tooltip` so the browser stops drawing its own
     * tooltip on top of ours.
     *
     * `title` doubles as the accessible name when nothing else labels the
     * element, so removing it can leave a bare icon button anonymous. Where
     * that would happen -- no aria-label, no text -- the text is copied to
     * aria-label first. Migration happens lazily on first interaction, so until
     * then the original `title` is still doing that job.
     */
    const migrate = (element: Element): string | null => {
      const title = element.getAttribute("title");
      if (title === null) return element.getAttribute("data-tooltip");
      element.removeAttribute("title");
      const text = title.trim();
      if (!text) return element.getAttribute("data-tooltip");
      element.setAttribute("data-tooltip", text);
      if (!element.getAttribute("aria-label") && !element.textContent?.trim()) {
        element.setAttribute("aria-label", text);
      }
      return text;
    };

    const place = (element: Element) => {
      const node = ensureTip();
      const rect = element.getBoundingClientRect();
      const box = node.getBoundingClientRect();

      // Prefer above; drop below when there is not room.
      let placement = "top";
      let top = rect.top - box.height - GAP;
      if (top < EDGE) {
        placement = "bottom";
        top = rect.bottom + GAP;
      }

      const centre = rect.left + rect.width / 2;
      const left = Math.min(
        Math.max(centre - box.width / 2, EDGE),
        Math.max(window.innerWidth - box.width - EDGE, EDGE),
      );

      node.style.top = `${Math.round(top)}px`;
      node.style.left = `${Math.round(left)}px`;
      node.setAttribute("data-placement", placement);
      // Keep the arrow under the trigger even when the chip was clamped.
      node.style.setProperty("--app-tooltip-arrow", `${Math.round(centre - left)}px`);
    };

    const show = (element: Element) => {
      const text = migrate(element);
      if (!text) return;
      const node = ensureTip();
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      current = element;
      node.textContent = text;
      node.setAttribute("aria-hidden", "false");
      // Position before revealing, or the first frame lands in the corner.
      node.style.opacity = "0";
      node.removeAttribute("data-visible");
      place(element);
      node.style.removeProperty("opacity");
      node.setAttribute("data-visible", "true");
    };

    const hide = () => {
      if (!tip) return;
      window.clearTimeout(hideTimer);
      hideTimer = 0;
      current = null;
      tip.removeAttribute("data-visible");
      tip.setAttribute("aria-hidden", "true");
    };

    const trigger = (target: EventTarget | null): Element | null =>
      target instanceof Element ? target.closest("[title], [data-tooltip]") : null;

    const onPointerDown = (event: PointerEvent) => {
      lastPointerType = event.pointerType || "mouse";
    };

    // mouseover/mouseout rather than mouseenter/mouseleave: these bubble, which
    // is what makes one delegated listener possible.
    const onMouseOver = (event: MouseEvent) => {
      // A tap also emits compatibility mouse events; let the click path win.
      if (lastPointerType === "touch") return;
      const element = trigger(event.target);
      if (element && element !== current) show(element);
    };

    const onMouseOut = (event: MouseEvent) => {
      if (current && !trigger(event.relatedTarget)) hide();
    };

    const onFocusIn = (event: FocusEvent) => {
      const element = trigger(event.target);
      if (element) show(element);
    };

    /*
     * Touch. No preventDefault anywhere here -- the tap continues through to
     * the link or button exactly as it would without a tooltip; the chip simply
     * appears alongside and times itself out.
     */
    const onClick = (event: MouseEvent) => {
      if (lastPointerType !== "touch" && lastPointerType !== "pen") return;
      const element = trigger(event.target);
      if (!element) {
        hide();
        return;
      }
      show(element);
      hideTimer = window.setTimeout(hide, TAP_VISIBLE_MS);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", hide);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);
    // Escape hatch for code that needs the chip out of the way -- the copy
    // button raises this so its success message is not competing with the
    // "Copy link" label still sitting in the same spot on a touch timer.
    document.addEventListener("tooltip:hide", hide);
    // A tooltip is positioned against a rect that scrolling or resizing
    // invalidates, so drop it rather than leave it stranded.
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", hide);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("tooltip:hide", hide);
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
      window.clearTimeout(hideTimer);
      tip?.remove();
    };
  }, []);

  return null;
}
