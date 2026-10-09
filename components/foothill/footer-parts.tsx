"use client";

import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

import { Icon } from "@/components/foothill/icons";
import { openMarkdown } from "@/components/foothill/markdown";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { hasTwin, twinOf } from "@/lib/site/twins";

/**
 * The username, set as large as the page is wide and cropped at the foot,
 * climbing into place as the reader reaches the end. Its size is measured
 * rather than guessed: the word is set at 100px, measured, and scaled to 96%
 * of its band, so a longer username still fits.
 */
export function GiantWord({ word }: { word: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.parentElement) return;
    const fit = () => {
      el.style.fontSize = "100px";
      const width = el.getBoundingClientRect().width;
      if (width) el.style.fontSize = `${(100 * el.parentElement!.clientWidth * 0.96) / width}px`;
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  useGSAP(() => {
    const el = ref.current;
    if (!el?.parentElement) return;
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo(
        el,
        { yPercent: 45 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom bottom", scrub: true },
        },
      );
    });
    return () => mm.revert();
  });

  return <span ref={ref}>{word}</span>;
}

/** "This page as Markdown", on the footer's bottom line of every page that has one. */
export function FooterTwin() {
  const pathname = usePathname();
  if (!hasTwin(pathname)) return null;
  const file = twinOf(pathname);
  return (
    <a
      className="ul"
      href={file}
      onClick={(event) => {
        event.preventDefault();
        openMarkdown(file);
      }}
    >
      This page as Markdown
    </a>
  );
}

/** llms.txt among the Site links. It opens in the viewer; the address is real. */
export function LlmsLink() {
  return (
    <a
      href="/llms.txt"
      onClick={(event) => {
        event.preventDefault();
        openMarkdown("/llms.txt");
      }}
    >
      <Icon name="md" />
      <span className="roll">
        <span>llms.txt</span>
      </span>
    </a>
  );
}
