"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

export type HeatCell = { level: number; tip: string };

/**
 * A year as 53 weeks of seven squares, the squares growing to fill the panel
 * while the 3px gap between them does not. Darker is more; an empty day is an
 * outlined square. The hovered or tapped day is also written out under the
 * grid, so its value reads on a phone, where nothing hovers.
 *
 * The month labels sit inside the same scroller as the squares, so on a
 * narrow screen they move together and a label always names the week under it.
 */
export function Heatmap({
  cells,
  months,
  empty,
}: {
  /** Column by column, oldest week first, Sunday first within a week. */
  cells: HeatCell[];
  /** Each month's first column, 0 to 52. */
  months: { column: number; name: string }[];
  /** What the readout says before anything is picked, on a year with nothing in it. */
  empty: string;
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (event: React.SyntheticEvent) => {
    const index = (event.target as HTMLElement).dataset?.i;
    if (index != null) setPicked(cells[Number(index)]?.tip ?? null);
  };
  const quiet = cells.every((cell) => cell.level === 0);

  return (
    <div>
      <div className="heat-scroll" aria-hidden="true">
        <div>
          <div className="heat-axis mono mute">
            {months.map((month) => (
              <span key={`${month.column}-${month.name}`} style={{ gridColumnStart: month.column + 1 }}>
                {month.name}
              </span>
            ))}
          </div>
          <div className="heat" data-fh-sweep="" onPointerOver={pick} onClick={pick}>
            {cells.map((cell, i) => (
              <i key={i} data-l={cell.level} data-i={i} title={cell.tip} />
            ))}
          </div>
        </div>
      </div>
      <div className="heat-foot">
        <div className="legend">
          <span>Less</span>
          <span style={{ display: "inline-flex", gap: 3 }}>
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className="hk" data-l={level} />
            ))}
          </span>
          <span>More</span>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={picked ?? "none"}
            className="mono mute readout"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {picked ?? (quiet ? empty : "Point at or tap a day")}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
