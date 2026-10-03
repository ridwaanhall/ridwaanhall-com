"use client";

import { Children, useState } from "react";

import { TEXT_BUTTON } from "@/components/foothill/classes";
import { cn } from "@/lib/utils/cn";

/**
 * A long list shown a batch at a time.
 *
 * The rows are rendered on the server and all arrive in the HTML -- this only
 * decides how many are on screen -- so search engines and a reader with the
 * page saved still have every one.
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
  const remaining = items.length - shown;

  return (
    <>
      <ul className={className}>
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
          className={cn(TEXT_BUTTON, "mt-6")}
        >
          Show {Math.min(step, remaining)} more {noun}
          <span className="text-line">/</span>
          <span className="tabular-nums">{remaining} left</span>
        </button>
      )}
    </>
  );
}
