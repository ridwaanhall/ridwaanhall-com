"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { SPRING } from "@/components/foothill/controls";

export type Section = { id: string; label: string };

/**
 * A page's contents: on a wide screen a list beside the text, sticky under
 * the navbar; below that, a strip pinned under the navbar that scrolls
 * sideways and keeps the current section in view. The marker slides to the
 * section being read.
 *
 * It finds its sections by id with `getElementById`'s visible match -- under
 * Cache Components the page navigated away from stays in the document inside
 * a hidden `<Activity>`, and may carry the same ids.
 */
export function SectionIndex({
  sections,
  label = "On this page",
  children,
}: {
  sections: Section[];
  label?: string;
  /** More under the list on a wide screen: the CV's links on About. */
  children?: React.ReactNode;
}) {
  const [current, setCurrent] = useState(sections[0]?.id ?? "");
  const [atStart, setAtStart] = useState(true);
  const nav = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const find = (id: string) =>
    Array.from(document.querySelectorAll<HTMLElement>(`[id="${CSS.escape(id)}"]`)).find((el) => el.offsetParent !== null) ?? null;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setCurrent(entry.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    sections.forEach(({ id }) => {
      const el = find(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  // Keep the current section's link in view when the strip scrolls sideways.
  useEffect(() => {
    const strip = nav.current;
    const link = strip?.querySelector<HTMLElement>("a.on");
    if (!strip || !link || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: link.offsetLeft - (strip.clientWidth - link.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
  }, [current, reduce]);

  const jump = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    const target = find(id);
    if (!target) return;
    const offset = window.innerWidth < 1024 ? 130 : 80;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <aside className="toc">
      <nav
        ref={nav}
        aria-label={label}
        data-at-start={atStart ? "" : undefined}
        onScroll={(event) => setAtStart(event.currentTarget.scrollLeft < 4)}
      >
        <span className="mono mute toc-label">{label}</span>
        <LayoutGroup id="toc">
          {sections.map(({ id, label: text }) => (
            <a key={id} href={`#${id}`} className={current === id ? "on" : undefined} onClick={jump(id)}>
              {current === id && <motion.span className="mark" layoutId="toc-mark" transition={SPRING} />}
              {text}
            </a>
          ))}
        </LayoutGroup>
        {children && <div className="resume">{children}</div>}
      </nav>
    </aside>
  );
}
