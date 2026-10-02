"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils/cn";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * An in-page index that follows the reader down a long page.
 *
 * It replaced the About page's tabs: every section is on the page and this is
 * how to get between them. One ScrollTrigger per section marks the link for
 * whichever section crosses the upper third of the viewport, and a thin bar
 * beside the list fills with progress through the whole page.
 *
 * Plain anchors underneath, so it works before hydration and with motion
 * turned off -- the scrolling itself is the browser's.
 */
export function SectionIndex({ items }: { items: { id: string; label: string }[] }) {
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [active, setActive] = useState(items[0]?.id ?? "");

  useGSAP(
    () => {
      const triggers = items.map(({ id }) => {
        const section = document.getElementById(id);
        if (!section) return null;
        return ScrollTrigger.create({
          trigger: section,
          start: "top 35%",
          end: "bottom 35%",
          onToggle: (self) => {
            if (self.isActive) setActive(id);
          },
        });
      });

      const first = items[0] && document.getElementById(items[0].id);
      const last = items.at(-1) && document.getElementById(items.at(-1)!.id);
      const progress =
        first && last && bar.current
          ? ScrollTrigger.create({
              trigger: first,
              endTrigger: last,
              start: "top 35%",
              end: "bottom 35%",
              onUpdate: (self) => gsap.set(bar.current, { scaleY: self.progress }),
            })
          : null;

      return () => {
        triggers.forEach((trigger) => trigger?.kill());
        progress?.kill();
      };
    },
    { scope: root, dependencies: [items.map((item) => item.id).join()] },
  );

  return (
    <nav ref={root} aria-label="On this page" className="relative">
      <span aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-px bg-zinc-800" />
      <span
        ref={bar}
        aria-hidden="true"
        className="absolute top-0 bottom-0 left-0 w-px origin-top scale-y-0 bg-zinc-100"
      />
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? "location" : undefined}
              className={cn(
                "block rounded-sm py-1.5 pl-5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
                active === item.id ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-200",
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
