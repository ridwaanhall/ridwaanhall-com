"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { EmptyTrack, fillOf, Kpi, Legend, Timeline } from "@/components/foothill/charts/boxes";
import { Seg } from "@/components/foothill/controls";
import { Animate } from "@/components/foothill/motion";
import type { WakatimeDay } from "@/lib/data/wakatime-day";
import { changeFromYesterday } from "@/lib/data/wakatime-format";

type Which = "today" | "yesterday";

/**
 * One day along the clock, today or yesterday. The same pill as "In the
 * editor"'s range and the same crossfade; each day carries its own sentence
 * for a screen reader.
 *
 * Either day may be missing on its own (each is its own cached read), so the
 * switch only appears when both answered, and the panel opens on whichever
 * did. Both missing is the page's to say, with the "did not answer" panel.
 */
export function DayPanel({ today, yesterday }: { today: WakatimeDay | null; yesterday: WakatimeDay | null }) {
  const [which, setWhich] = useState<Which>(today ? "today" : "yesterday");
  const day = which === "today" ? today : yesterday;
  if (!day) return null;

  const isToday = which === "today";
  const title = isToday ? "Today, so far" : "Yesterday";
  // The day boundary every figure below is cut on. Said where the date is,
  // because a reader in another zone would otherwise read the ribbon's hours
  // as their own.
  const sub = `${day.date} · ${day.zone_label} · via WakaTime`;
  // Only today is put beside the other day: yesterday is complete and today
  // still growing, so the comparison only reads one way round.
  const change = isToday && yesterday ? changeFromYesterday(day.total_seconds, yesterday.total_seconds) : undefined;
  const summary = day.has_activity
    ? `${day.total} in the editor ${isToday ? "today" : "yesterday"} across ${day.sessions} sessions, from ${day.active_window} ${day.zone_label}. The longest stretch was ${day.longest_session}.${change ? (change.startsWith("none") ? " Nothing was logged yesterday." : ` That is ${change}.`) : ""}`
    : isToday
      ? "No sessions yet today."
      : "No sessions yesterday.";

  return (
    <section className="panel" aria-label={title}>
      <div className="panel-h">
        <div>
          <h3>{title}</h3>
          <p className="meta">{sub}</p>
        </div>
        {today && yesterday && (
          <Seg
            id="day"
            label="Day"
            value={which}
            onChange={setWhich}
            items={[
              ["today", "Today"],
              ["yesterday", "Yesterday"],
            ]}
          />
        )}
      </div>
      <p className="sr">{summary}</p>
      <Animate>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={which} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {day.has_activity ? (
              <>
                <div className="panel-b">
                  <Timeline blocks={day.blocks} />
                  <div style={{ marginTop: 14 }}>
                    <Legend items={day.languages.map((language) => ({ fill: fillOf(language.slot), label: `${language.name} ${language.time}` }))} />
                  </div>
                </div>
                <div className="kpis k3" style={{ borderTop: "1px solid var(--fh-line)" }}>
                  <Kpi label="In the editor" value={day.total} sub={change} />
                  <Kpi label="Sessions" value={day.sessions} tip="A session ends after 15 minutes without a keystroke" />
                  <Kpi label="Longest" value={day.longest_session} tip="The longest run without a 15-minute break" />
                  <Kpi label="Window" value={day.active_window} tip={`First and last activity of the day, ${day.zone_label}`} />
                  <Kpi label="Longest break" value={day.longest_break} />
                  <Kpi label="Busiest hour" value={day.peak_hour} tip={day.peak_hour !== "--" ? `${day.peak_hour_detail}, ${day.zone_label}` : undefined} />
                </div>
              </>
            ) : (
              <>
                <div className="panel-b">
                  <EmptyTrack label={isToday ? "No sessions yet" : "No sessions that day"} />
                  <p className="meta" style={{ marginTop: 14 }}>
                    {isToday ? "The day starts at the first save in the editor." : "Nothing was logged in the editor yesterday."}
                  </p>
                </div>
                <div className="kpis k3" style={{ borderTop: "1px solid var(--fh-line)" }}>
                  {["In the editor", "Sessions", "Longest", "Window", "Longest break", "Busiest hour"].map((label) => (
                    <Kpi key={label} label={label} value={<span className="mute">{label === "Sessions" ? "0" : label === "In the editor" ? "0m" : "–"}</span>} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </Animate>
    </section>
  );
}
