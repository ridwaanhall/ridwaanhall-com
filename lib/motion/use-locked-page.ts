"use client";

import { useEffect, useRef } from "react";

/**
 * While an overlay is open: the page behind it holds still and Escape closes
 * it.
 *
 * The lock is a class on `<html>` (`html.locked` in styles/globalScrollbar.css)
 * rather than a style on `<body>`, and it is counted: two overlays can be
 * open at once -- a confirm dialog over a drawer -- and the first to close
 * must not unlock the page under the second. The scrollbar keeps its gutter
 * (`scrollbar-gutter: stable`), so locking never shifts the layout sideways.
 */
let holders = 0;

export function useLockedPage(open: boolean, onEscape?: () => void) {
  const escape = useRef(onEscape);
  useEffect(() => {
    escape.current = onEscape;
  });

  useEffect(() => {
    if (!open) return;
    holders += 1;
    document.documentElement.classList.add("locked");
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") escape.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      holders -= 1;
      if (holders <= 0) {
        holders = 0;
        document.documentElement.classList.remove("locked");
      }
    };
  }, [open]);
}
