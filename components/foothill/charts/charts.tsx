/**
 * The dashboard's charts, drawn as plain HTML and SVG on the server.
 *
 * No chart library: each of these is a handful of positioned boxes, and every
 * number they need was already decided in `lib/data`. Hover detail rides on
 * `title`, which the site's tooltip provider turns into a real tooltip, so the
 * marks stay server-rendered and still answer a pointer.
 *
 * Colour by job: `seriesColor` is identity (a language, a category) in the
 * fixed slot order `lib/data` assigned; `heatColor` is magnitude, one hue.
 * Text never wears a series colour -- a swatch beside it carries identity.
 */

import type { WakatimeEntry } from "@/lib/data/wakatime";
import type { DayBlock } from "@/lib/data/wakatime-day";
import type { RhythmDay, TrendWeek } from "@/lib/data/wakatime-rhythm";
import type { CalendarWeek } from "@/lib/utils/coding-calendar";
import { cn } from "@/lib/utils/cn";

/** A categorical slot's colour; -1 is the leftover "everything else" row. */
function seriesColor(slot: number): string {
  return slot >= 0 && slot < 5 ? `var(--fh-s${slot + 1})` : "var(--fh-s0)";
}

/** A day's value as one of five steps of the heat ramp. */
function heatColor(value: number, peak: number): string {
  if (value <= 0 || peak <= 0) return "var(--fh-heat-0)";
  const step = Math.min(4, Math.max(1, Math.ceil((value / peak) * 4)));
  return `var(--fh-heat-${step})`;
}

/** A swatch and its name -- the legend entry every multi-series chart carries. */
export function Key({ items }: { items: { name: string; slot: number; note?: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
      {items.map((item) => (
        <li key={`${item.slot}-${item.name}`} className="flex items-center gap-2">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-[2px]" style={{ background: seriesColor(item.slot) }} />
          <span className="text-ink">{item.name}</span>
          {item.note && <span className="fh-mono text-[11px] text-mute">{item.note}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Today as a ribbon from midnight to midnight, one block per stretch of work. */
export function DayRibbon({ blocks, label }: { blocks: DayBlock[]; label: string }) {
  return (
    <figure>
      <div role="img" aria-label={label} className="relative h-12 w-full overflow-hidden rounded-[4px] bg-raise">
        {[0.25, 0.5, 0.75].map((at) => (
          <span key={at} aria-hidden="true" className="absolute inset-y-0 w-px bg-line" style={{ left: `${at * 100}%` }} />
        ))}
        {blocks.map((block, i) => (
          <span
            key={i}
            data-fh-bar
            title={block.detail}
            className="absolute inset-y-1.5 rounded-[2px] outline-2 outline-raise"
            style={{
              left: `${block.start * 100}%`,
              width: `${block.width * 100}%`,
              background: seriesColor(block.slot),
            }}
          />
        ))}
      </div>
      <div aria-hidden="true" className="fh-mono mt-2 flex justify-between text-[11px] text-mute tabular-nums">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </figure>
  );
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * A year as 53 columns of seven days. Scrolls sideways on a narrow screen
 * rather than shrinking cells below what a pointer can find.
 */
export function Heatmap({
  weeks,
  months,
  peak,
  describe,
  label,
}: {
  weeks: CalendarWeek[];
  months: { firstDay: string; name: string }[];
  peak: number;
  describe: (value: number) => string;
  label: string;
}) {
  // A month's label sits over the first column whose week contains its first day.
  const monthAt = new Map<number, string>();
  for (const month of months) {
    const column = weeks.findIndex((week) => week.firstDay >= month.firstDay || week.days.some((d) => d.date === month.firstDay));
    if (column >= 0 && !monthAt.has(column)) monthAt.set(column, month.name);
  }

  return (
    <figure className="fh-strip -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="min-w-[720px]">
        <div aria-hidden="true" className="fh-mono ml-9 grid grid-cols-[repeat(53,minmax(0,1fr))] gap-[3px] text-[10px] text-mute">
          {weeks.map((week, column) => (
            <span key={week.firstDay} className="h-4 overflow-visible whitespace-nowrap">
              {monthAt.get(column) ?? ""}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <div aria-hidden="true" className="fh-mono grid w-7 grid-rows-7 gap-[3px] text-[10px] text-mute">
            {WEEKDAYS.map((day, i) => (
              <span key={day} className="flex items-center leading-none">
                {i % 2 === 1 ? day : ""}
              </span>
            ))}
          </div>
          <div role="img" aria-label={label} data-fh-sweep className="grid flex-1 grid-cols-[repeat(53,minmax(0,1fr))] gap-[3px]">
            {weeks.map((week) => (
              <div key={week.firstDay} className="grid grid-rows-7 gap-[3px]">
                {Array.from({ length: 7 }, (_, weekday) => {
                  const day = week.days.find((d) => new Date(`${d.date}T00:00:00Z`).getUTCDay() === weekday);
                  return day ? (
                    <span
                      key={weekday}

                      title={`${day.date}: ${describe(day.value)}`}
                      className="aspect-square rounded-[2px]"
                      style={{ background: heatColor(day.value, peak) }}
                    />
                  ) : (
                    <span key={weekday} className="aspect-square" />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div aria-hidden="true" className="fh-mono mt-3 flex items-center justify-end gap-1.5 text-[10px] text-mute">
          Less
          {[0, 1, 2, 3, 4].map((step) => (
            <span key={step} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `var(--fh-heat-${step})` }} />
          ))}
          More
        </div>
      </div>
    </figure>
  );
}

/** Each weekday's average as a stacked column, against the busiest day. */
export function WeekColumns({
  days,
  peakLabel,
  halfLabel,
  label,
}: {
  days: RhythmDay[];
  peakLabel: string;
  halfLabel: string;
  label: string;
}) {
  return (
    <figure role="img" aria-label={label}>
      <div className="relative h-56">
        {[
          { at: 100, text: peakLabel },
          { at: 50, text: halfLabel },
        ].map((line) => (
          <div key={line.at} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${line.at}%` }}>
            <span className="fh-mono absolute -top-4 right-0 text-[10px] text-mute">{line.text}</span>
          </div>
        ))}
        <div className="absolute inset-0 grid grid-cols-7 items-end gap-2 border-b border-ink/40 md:gap-4">
          {days.map((day) => (
            <div key={day.name} title={day.detail} className="flex h-full flex-col justify-end">
              <div data-fh-col className="flex flex-col-reverse gap-[2px] overflow-hidden rounded-t-[4px]" style={{ height: `${day.height}%` }}>
                {day.segments.map((segment) => (
                  <span
                    key={segment.name}
                    style={{ height: `${segment.percent}%`, background: seriesColor(segment.slot) }}
                    className="block w-full"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="fh-mono mt-2 grid grid-cols-7 gap-2 text-center text-[11px] text-mute md:gap-4">
        {days.map((day) => (
          <span key={day.name}>{day.short}</span>
        ))}
      </div>
    </figure>
  );
}

/** One measure over time, as a 2px line with its area faintly beneath. */
export function TrendLine({ points, label }: { points: TrendWeek[]; label: string }) {
  const W = 600;
  const H = 160;
  const max = Math.max(10, ...points.map((p) => p.y));
  const xy = points.map((p) => [p.x * W, H - (p.y / max) * (H - 12)] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${W} ${H} L0 ${H} Z`;
  return (
    <figure role="img" aria-label={label}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full overflow-visible">
        <line x1="0" x2={W} y1={H} y2={H} className="stroke-line" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path data-fh-fade d={area} fill="var(--fh-s1)" opacity="0.12" />
        <path data-fh-draw pathLength={1} d={line} fill="none" stroke="var(--fh-s1)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {xy.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="10" fill="transparent">
            <title>{points[i].detail}</title>
          </circle>
        ))}
      </svg>
    </figure>
  );
}

/** Where one value sits against two reference marks on a shared 0-100 axis. */
export function Bullet({
  value,
  valueLabel,
  marks,
  label,
}: {
  value: number;
  valueLabel: string;
  marks: { at: number; label: string }[];
  label: string;
}) {
  return (
    <figure role="img" aria-label={label} className="pt-6 pb-8">
      <div className="relative h-3 rounded-full bg-raise">
        <div data-fh-bar className="absolute inset-y-0 left-0 rounded-full bg-ink" style={{ width: `${Math.min(100, value)}%` }} title={valueLabel} />
        {marks.map((mark, i) => (
          <div key={mark.label} className="absolute -inset-y-2 w-px bg-mute" style={{ left: `${Math.min(100, mark.at)}%` }}>
            <span
              className={cn(
                "fh-mono absolute left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-mute",
                i % 2 === 0 ? "-top-5" : "top-6",
              )}
            >
              {mark.label}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}

/** A ranked list as thin bars: name, share, time. */
export function RankBars({ entries, slotted = false }: { entries: WakatimeEntry[]; slotted?: boolean }) {
  const top = Math.max(1, ...entries.map((entry) => entry.percent));
  return (
    <ul className="space-y-3">
      {entries.map((entry, i) => (
        <li key={entry.name} title={`${entry.name}: ${entry.time} (${entry.percent}%)`}>
          <div className="flex items-baseline justify-between gap-4 text-[14px]">
            <span className="truncate text-ink">{entry.name}</span>
            <span className="fh-mono shrink-0 text-[11px] text-mute tabular-nums">
              {entry.time}, {Math.round(entry.percent)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-raise">
            <div
              data-fh-bar
              className="h-full rounded-full"
              style={{ width: `${(entry.percent / top) * 100}%`, background: slotted ? seriesColor(i) : "var(--fh-ink)" }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Two parts of one whole, side by side, with a 2px gap between them. */
export function SplitBar({
  parts,
  label,
}: {
  parts: { name: string; value: number; slot: number }[];
  label: string;
}) {
  const total = parts.reduce((sum, part) => sum + part.value, 0) || 1;
  return (
    <figure>
      <div role="img" aria-label={label} className="flex h-3 gap-[2px] overflow-hidden rounded-full">
        {parts.map((part) => (
          <span
            key={part.name}
            data-fh-bar
            title={`${part.name}: ${part.value.toLocaleString("en-US")}`}
            style={{ width: `${(part.value / total) * 100}%`, background: seriesColor(part.slot) }}
          />
        ))}
      </div>
      <div className="mt-3">
        <Key
          items={parts.map((part) => ({
            name: part.name,
            slot: part.slot,
            note: `${part.value.toLocaleString("en-US")}, ${Math.round((part.value / total) * 100)}%`,
          }))}
        />
      </div>
    </figure>
  );
}
