"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils/cn";

/**
 * A long page's table of contents, marking the section being read.
 *
 * Plain anchors, so it works before hydration and with scripting off; the
 * observer only adds which one is current.
 */
export function SectionIndex({
  sections,
  label = "On this page",
}: {
  sections: { id: string; label: string }[];
  label?: string;
}) {
  const [current, setCurrent] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => el !== null);
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

  return (
    <nav aria-label={label}>
      <p className="fh-mono text-[11px] tracking-[0.16em] text-mute uppercase">{label}</p>
      <ul className="mt-4 space-y-1 border-l border-line">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={current === section.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1.5 pl-4 text-[14px] transition-colors",
                current === section.id
                  ? "border-sulfur-mark text-ink"
                  : "border-transparent text-mute hover:text-ink",
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
