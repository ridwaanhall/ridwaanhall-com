"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { Bars, Kpi } from "@/components/foothill/charts/boxes";
import { Seg } from "@/components/foothill/controls";
import type { WakatimeEntry } from "@/lib/data/wakatime";

export type EditorRange = {
  sub: string;
  summary: string;
  kpis: { label: string; value: string; sub?: string; tip?: string }[];
  note?: string;
  bars: { title: string; entries: WakatimeEntry[] }[];
};

/**
 * "In the editor", over the last seven days or the last year. The pill slides
 * and the panel crossfades; each range carries its own sentence for a screen
 * reader, which is shown in place of the charts.
 */
export function EditorPanel({ week, year }: { week: EditorRange | null; year: EditorRange | null }) {
  const [range, setRange] = useState<"week" | "year">(week ? "week" : "year");
  const shown = range === "week" ? week : year;
  if (!shown) return null;

  return (
    <section className="panel" aria-label="In the editor">
      <div className="panel-h">
        <div>
          <h3>In the editor</h3>
          <p className="meta">{shown.sub}</p>
        </div>
        {week && year && (
          <Seg
            id="range"
            label="Range"
            value={range}
            onChange={setRange}
            items={[
              ["week", "7 days"],
              ["year", "Year"],
            ]}
          />
        )}
      </div>
      <p className="sr">{shown.summary}</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={range} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <div className="kpis k4" aria-hidden="true">
            {shown.kpis.map((kpi) => (
              <Kpi key={kpi.label} {...kpi} />
            ))}
          </div>
          {shown.note && (
            <p className="meta" style={{ padding: "12px 18px", borderBottom: "1px solid var(--fh-line)" }}>
              {shown.note}
            </p>
          )}
          <div className="panel-b dgrid three" aria-hidden="true">
            {shown.bars.map((bar) => (
              <Bars key={bar.title} title={bar.title} entries={bar.entries} />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
