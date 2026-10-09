import { Icon } from "@/components/foothill/icons";
import type { WakatimeEntry } from "@/lib/data/wakatime";
import { cn } from "@/lib/utils/cn";

/*
 * The dashboard's charts as boxes with lines, in black and the greys: a
 * series is told apart by its fill -- solid, grey, light grey, hatched,
 * cross-hatched, outlined (`.f1` to `.f6` in styles/site.css) -- never by a
 * hue. Pure markup; the entrances are `Animate`'s, keyed on the `data-fh-*`
 * marks each part carries, and every chart is hidden from a screen reader,
 * which gets the panel's one-sentence summary instead.
 */

/** A source's colour slot to the fill it is drawn with; the leftover slot is outlined. */
const FILLS = ["f1", "f2", "f4", "f3", "f5", "f6"];
export const fillOf = (slot: number) => (slot >= 0 ? FILLS[slot % FILLS.length] : "f6");

/**
 * "3 hrs 29 mins" as "3h 29m": WakaTime writes its durations as words, which
 * is right in a sentence and too wide for a figure set large in a quarter of
 * a panel. Anything that is not a duration is left exactly as it came.
 */
export function tight(text: string): string {
  if (!/\d\s*(hrs?|mins?|secs?)\b/.test(text)) return text;
  return text
    .replace(/(\d)\s*hrs?\b/g, "$1h")
    .replace(/(\d)\s*mins?\b/g, "$1m")
    .replace(/(\d)\s*secs?\b/g, "$1s");
}

/** A figure in a ruled cell, with what it means on hover and its change on last week. */
export function Kpi({
  label,
  value,
  sub,
  tip,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  tip?: string;
  /** "+9%" or "-6%", against last week. */
  delta?: string | null;
}) {
  return (
    <div>
      <span
        className="meta"
        title={tip}
        tabIndex={tip ? 0 : undefined}
        style={tip ? { textDecoration: "underline dotted", textUnderlineOffset: 3, cursor: "help" } : undefined}
      >
        {label}
      </span>
      <b className="num">{typeof value === "string" ? tight(value) : value}</b>
      {sub && <span className="meta">{sub}</span>}
      {delta && (
        <span className={cn("delta", delta.startsWith("-") && "down")}>
          <Icon name="up" size={12} />
          {delta.replace("-", "")} on last week
        </span>
      )}
    </div>
  );
}

/** Ranked bars on ruled tracks: a name, its value, and a track filled to its share. */
export function Bars({ title, entries, fills }: { title: string; entries: WakatimeEntry[]; fills?: string[] }) {
  if (!entries.length) return null;
  return (
    <div>
      <p className="meta" style={{ marginBottom: 12 }}>
        {title}
      </p>
      <div className="bars">
        {entries.map((entry, i) => (
          <div key={entry.name} className="bar" title={`${entry.name}: ${entry.time}`}>
            <div>
              <span>{entry.name}</span>
              <span className="mono mute">{entry.value ?? `${entry.time} · ${Math.round(entry.percent)}%`}</span>
            </div>
            <div className="track">
              <i className={fills?.[i] ?? ["f1", "f2", "f4", "f3", "f5"][i % 5]} style={{ width: `${Math.max(entry.percent, 0.6)}%` }} data-fh-bar="" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** The hours of a day as one strip, each session a block the strip's full height. */
export function Timeline({ blocks }: { blocks: { start: number; width: number; slot: number; detail: string }[] }) {
  return (
    <>
      <div className="timeline" aria-hidden="true">
        {blocks.map((block, i) => (
          <i
            key={i}
            className={fillOf(block.slot)}
            style={{ left: `${block.start * 100}%`, width: `${Math.max(block.width * 100, 0.25)}%` }}
            title={block.detail}
            data-fh-bar=""
          />
        ))}
      </div>
      <Axis labels={["00", "06", "12", "18", "24"]} />
    </>
  );
}

/** A day with nothing on it yet: the same strip, empty and hatched, saying so. */
export function EmptyTrack({ label, height = 56 }: { label: string; height?: number }) {
  return (
    <div className="timeline empty-track" style={{ height }}>
      <span className="mono mute">{label}</span>
    </div>
  );
}

export function Axis({ labels }: { labels: string[] }) {
  return (
    <div className="axis mono mute" aria-hidden="true">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

/** The key under a chart: each fill and what it stands for. */
export function Legend({ items }: { items: { fill: string; label: React.ReactNode }[] }) {
  return (
    <div className="legend">
      {items.map((item, i) => (
        <span key={i}>
          <i className={item.fill} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

/** One bar split into its parts, each box as wide as its share. */
export function Split({ parts, height = 34 }: { parts: { value: number; fill: string; tip: string }[]; height?: number }) {
  return (
    <div className="split" style={{ height }} aria-hidden="true">
      {parts
        .filter((part) => part.value > 0)
        .map((part) => (
          <i key={part.tip} className={part.fill} style={{ flex: part.value }} title={part.tip} data-fh-bar="" />
        ))}
    </div>
  );
}

/** The average weekday as stacked boxes, one column a day, each part a kind of work. */
export function WeekColumns({
  days,
}: {
  days: { short: string; height: number; detail: string; segments: { name: string; percent: number; slot: number; tip: string }[] }[];
}) {
  return (
    <>
      <div className="week" aria-hidden="true">
        {days.map((day) => (
          <div key={day.short} title={day.detail} data-fh-col="">
            {day.segments.map((segment) => (
              <i
                key={segment.name}
                className={fillOf(segment.slot)}
                style={{ height: `${(segment.percent * day.height) / 100}%` }}
                title={segment.tip}
              />
            ))}
          </div>
        ))}
      </div>
      <Axis labels={days.map((day) => day.short)} />
    </>
  );
}

/** A line over weeks, its area shaded, its points answering a hover. */
export function Spark({ points }: { points: { x: number; y: number; detail: string }[] }) {
  // Drawn in a 520 by 130 box, the share from 0 at the bottom (125) to 100 at the top (5).
  const at = points.map((point) => [point.x * 520, 125 - (point.y / 100) * 120] as const);
  const line = at.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L");
  return (
    <div style={{ position: "relative", marginTop: 16 }}>
      <svg className="spark" viewBox="0 0 520 130" preserveAspectRatio="none" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <line key={i} x1="0" x2="520" y1={i * 40 + 5} y2={i * 40 + 5} stroke="var(--fh-line)" />
        ))}
        {at.length > 1 && (
          <>
            <path d={`M${line} L520,125 L0,125 Z`} fill="var(--fh-raise)" data-fh-fade="" />
            <path d={`M${line}`} fill="none" stroke="var(--fh-ink)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" pathLength={1} data-fh-draw="" />
          </>
        )}
      </svg>
      {points.map((point, i) => (
        <span key={i} className="spark-pt" style={{ left: `${point.x * 100}%`, top: `${((125 - (point.y / 100) * 120) / 130) * 100}%` }} title={point.detail} />
      ))}
    </div>
  );
}

/** Two or three bars on a common scale, for me against everyone else. */
export function Compare({ rows, axis }: { rows: { label: string; value: number; text: string; fill: string }[]; axis: string }) {
  return (
    <div style={{ display: "grid", gap: 10, marginTop: 22 }}>
      {rows.map((row) => (
        <div key={row.label} className="bar" title={`${row.label}: ${row.text} a day`}>
          <div>
            <span>{row.label}</span>
            <span className="mono mute">{row.text}</span>
          </div>
          <div className="track" style={{ height: 18 }}>
            <i className={row.fill} style={{ width: `${Math.min(100, Math.max(row.value, 0.6))}%` }} data-fh-bar="" />
          </div>
        </div>
      ))}
      <Axis labels={["0", axis]} />
    </div>
  );
}
