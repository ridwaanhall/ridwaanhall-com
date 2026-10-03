"use client";

import { useEffect, useRef, useState } from "react";

import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";

/**
 * A long page's table of contents, marking the section being read.
 *
 * Plain anchors, so it works before hydration and with scripting off; the
 * observer only adds which one is current, and the marker beside the list
 * slides to it rather than jumping.
 */
export function SectionIndex({
  sections,
  label = "On this page",
}: {
  sections: { id: string; label: string }[];
  label?: string;
}) {
  const [current, setCurrent] = useState(sections[0]?.id ?? "");
  const list = useRef<HTMLUListElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Not `getElementById`: a page the reader left stays in the document,
    // hidden, so two documents' sections can share an id. The visible one is
    // the one being read.
    const targets = sections
      .map((section) =>
        Array.from(document.querySelectorAll<HTMLElement>(`[id="${section.id}"]`)).find(
          (el) => el.offsetParent !== null,
        ),
      )
      .filter((el): el is HTMLElement => el !== undefined);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) {
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setCurrent(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  useGSAP(
    () => {
      const link = list.current?.querySelector<HTMLElement>(`[href="#${current}"]`);
      if (!link || !marker.current) return;
      const target = { y: link.offsetTop, height: link.offsetHeight };
      if (window.matchMedia(MOTION_OK).matches) gsap.to(marker.current, { ...target, duration: 0.5, ease: "expo.out" });
      else gsap.set(marker.current, target);
    },
    { dependencies: [current] },
  );

  return (
    <nav aria-label={label}>
      <p className="text-[14px] font-medium text-ink">{label}</p>
      <div className="relative mt-4 border-l border-line">
        <span
          ref={marker}
          aria-hidden="true"
          className="absolute top-0 -left-px h-0 w-[2px] rounded-full bg-sulfur-mark"
        />
        <ul ref={list}>
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={current === section.id ? "location" : undefined}
              className={cn(
                "block py-1.5 pl-4 text-[15px] transition-colors",
                current === section.id ? "text-ink" : "text-mute hover:text-ink",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
        </ul>
      </div>
    </nav>
  );
}
