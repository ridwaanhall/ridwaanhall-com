"use client";

import { Children, useRef, useState } from "react";

import { TEXT_BUTTON } from "@/components/foothill/classes";
import { Icon } from "@/components/foothill/icons";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";

/**
 * A long list shown a batch at a time.
 *
 * The rows are rendered on the server and all arrive in the HTML -- this only
 * decides how many are on screen -- so search engines and a reader with the
 * page saved still have every one. A new batch rises in under the last.
 */
export function ShowMore({
  children,
  step = 10,
  noun,
  className,
}: {
  children: React.ReactNode;
  step?: number;
  noun: string;
  className?: string;
}) {
  const items = Children.toArray(children);
  const [shown, setShown] = useState(step);
  const list = useRef<HTMLUListElement>(null);
  const before = useRef(step);
  const remaining = items.length - shown;

  useGSAP(
    () => {
      const from = before.current;
      before.current = shown;
      if (shown <= from || !list.current) return;
      const arrived = Array.from(list.current.children).slice(from, shown);
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.from(arrived, { y: 20, autoAlpha: 0, duration: 0.7, ease: EASE, stagger: 0.05, clearProps: "all" });
      });
      return () => mm.revert();
    },
    { dependencies: [shown] },
  );

  return (
    <>
      <ul ref={list} className={className}>
        {items.map((item, index) => (
          <li key={index} hidden={index >= shown}>
            {item}
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setShown((count) => count + step)}
          className={cn(TEXT_BUTTON, "group mt-8 text-ink")}
        >
          <Icon name="chevron-down" className="transition-transform duration-500 group-hover:translate-y-0.5" />
          Show {Math.min(step, remaining)} more {noun}
          <span className="text-mute tabular-nums">, {remaining} left</span>
        </button>
      )}
    </>
  );
}
