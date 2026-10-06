import type { Metadata } from "next";
import { Suspense } from "react";

import { EYEBROW } from "@/components/foothill/classes";
import {
  Bullet,
  DayRibbon,
  Heatmap,
  Key,
  RankBars,
  SplitBar,
  TrendLine,
  WeekColumns,
} from "@/components/foothill/charts/charts";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { Animate, CountUp, PageMotion } from "@/components/foothill/motion";
import { Bar } from "@/components/foothill/skeleton";
import { Glance, PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getGitHubStats } from "@/lib/data/github";
import { getWakatimeStats } from "@/lib/data/wakatime";
import { getWakatimeDay } from "@/lib/data/wakatime-day";
import { getWakatimeRhythm } from "@/lib/data/wakatime-rhythm";
import { getWakatimeYear } from "@/lib/data/wakatime-year";
import { formatTime } from "@/lib/data/wakatime-format";
import { dashboardSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { dashboardSchemas } from "@/lib/seo/schemas-for-page";
import { cn } from "@/lib/utils/cn";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(dashboardSeo(about), about);
}

const WAKATIME = () => process.env.WAKATIME_API_KEY ?? "";

/**
 * The instrument panel: five live readings, each streamed on its own.
 *
 * Every panel is its own `<Suspense>` because each is its own upstream call
 * with its own cache lifetime, and one slow API should hold up only the
 * reading it feeds. A panel whose source answers with nothing draws nothing.
 */
export default async function DashboardPage() {
  const about = await getAboutData();
  if (!about) return null;

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={await dashboardSchemas(about)} />
      <div className={WRAP}>
        <PageHead
          title="The work, measured."
          lead="Time in the editor from WakaTime and contributions from GitHub, read live. Nothing here is typed in by hand."
          aside={
            <Glance
              items={[
                { label: "Editor time", value: "WakaTime" },
                {
                  label: "Contributions",
                  value: (
                    <a href={`https://github.com/${about.username}`} target="_blank" rel="noopener noreferrer" className="fh-link">
                      @{about.username}
                    </a>
                  ),
                },
                // The panels' cache lifetimes in lib/data: fifteen minutes for
                // today and GitHub, an hour for the year and the rhythm.
                { label: "Refreshed", value: "Every 15 minutes" },
              ]}
            />
          }
        />
        <div className="mt-20 space-y-28 md:mt-24">
          <Suspense fallback={<PanelSkeleton className="h-[400px] lg:h-[200px]" />}>
            <TodayPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton className="h-[1100px] md:h-[620px]" />}>
            <OverviewPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton className="h-[640px] md:h-[520px]" />}>
            <YearPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton className="h-[1000px] lg:h-[640px]" />}>
            <RhythmPanel />
          </Suspense>
          <Suspense fallback={<PanelSkeleton className="h-[460px] md:h-[380px]" />}>
            <GitHubPanel username={about.username} />
          </Suspense>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

function Panel({
  id,
  title,
  source,
  note,
  children,
}: {
  id: string;
  title: string;
  source: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <Animate as="section" aria-labelledby={id}>
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-line pt-4">
        <h2 id={id} className={EYEBROW}>
          {title}
        </h2>
        <p className="fh-mono text-[11px] text-mute">
          {note && <span className="mr-3">{note}</span>}
          via {source}
        </p>
      </div>
      {children}
    </Animate>
  );
}

/**
 * A reading as written by its source -- "1,204 hrs 31 mins" -- with every
 * number in it counting up into place and the words left as they are.
 */
function Figure({ value }: { value: React.ReactNode }) {
  if (typeof value !== "string") return <>{value}</>;
  return (
    <>
      {value.split(/(\d[\d,]*(?:\.\d+)?)/).map((part, i) => {
        if (i % 2 === 0) return part;
        const decimals = part.includes(".") ? part.split(".")[1].length : 0;
        return <CountUp key={i} value={Number(part.replace(/,/g, ""))} decimals={decimals} />;
      })}
    </>
  );
}

/** A row of headline figures, ruled between, never boxed. */
function Readings({ items, className }: { items: { label: string; value: React.ReactNode; detail?: string }[]; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 border-l border-line md:grid-cols-4", className)}>
      {items.map((item) => (
        <div key={item.label} className="border-r border-b border-line px-4 py-5 md:border-b-0" title={item.detail}>
          <dt className="text-[13px] text-mute">{item.label}</dt>
          <dd className="mt-2 text-[clamp(1.375rem,1.1rem+1.1vw,2rem)] leading-none font-medium tracking-[-0.03em] text-ink tabular-nums">
            <Figure value={item.value} />
          </dd>
          {item.detail && <p className="fh-mono mt-2 truncate text-[11px] text-mute">{item.detail}</p>}
        </div>
      ))}
    </dl>
  );
}

/** A panel's frame while its source answers, sized per breakpoint like the panel. */
function PanelSkeleton({ className }: { className: string }) {
  return (
    <div role="status" aria-busy="true" className="skeleton-pulse">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <div className="border-t border-line pt-4">
          <Bar className="h-3 w-32" />
        </div>
        <Bar className={cn("mt-8 w-full", className)} />
      </div>
    </div>
  );
}

async function TodayPanel() {
  const day = await getWakatimeDay(WAKATIME());
  if (!day) return null;
  return (
    <Panel id="today" title="Today, so far" source="WakaTime" note={day.date}>
      {day.has_activity ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <DayRibbon blocks={day.blocks} label={`Coding sessions across ${day.date}, ${day.total} in all`} />
            <div className="mt-5">
              <Key items={day.languages.map((language) => ({ name: language.name, slot: language.slot, note: language.time }))} />
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:col-span-4">
            {[
              ["In the editor", day.total],
              ["Sessions", String(day.sessions)],
              ["Longest", day.longest_session],
              ["Window", day.active_window],
              ["Longest break", day.longest_break],
              ["Busiest hour", day.peak_hour],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[13px] text-mute">{label}</dt>
                <dd className="mt-1 text-[17px] text-ink tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="fh-serif mt-8 text-[22px] text-mute italic">Nothing logged yet today. The editor is still closed.</p>
      )}
    </Panel>
  );
}

async function OverviewPanel() {
  const stats = await getWakatimeStats(WAKATIME());
  if (!stats) return null;
  const change =
    stats.today_change_type === "same"
      ? "level with yesterday"
      : `${Math.abs(Math.round(stats.today_change_percent))}% ${stats.today_change_type === "increase" ? "up on" : "down on"} yesterday`;
  const ai = stats.ai;

  return (
    <Panel id="overview" title="In the editor" source="WakaTime" note={`${stats.start_date} to ${stats.end_date}`}>
      <Readings
        className="mt-8"
        items={[
          { label: "Since I started", value: stats.all_time_coding, detail: `since ${stats.all_time_start}` },
          { label: "On an average day", value: stats.daily_average },
          { label: "This week", value: stats.this_week_coding },
          { label: "Today", value: stats.today_coding, detail: change },
        ]}
      />
      <p className="fh-mono mt-4 text-[11px] text-mute">
        Best day: {stats.best_day_coding} on {stats.best_day_date}
      </p>

      <div className="mt-12 grid gap-12 md:grid-cols-3">
        {[
          ["Languages", stats.top_3_languages],
          ["Doing", stats.top_3_categories],
          ["Editors", stats.top_3_editors],
        ].map(([label, entries]) => (
          <div key={label as string}>
            <p className="text-[13px] text-mute">{label as string}</p>
            <div className="mt-4">
              <RankBars entries={entries as typeof stats.top_3_languages} />
            </div>
          </div>
        ))}
      </div>

      {(ai.ai_lines > 0 || ai.human_lines > 0) && (
        <div className="mt-16">
          <p className={EYEBROW}>Working with AI</p>
          <div className="mt-6 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="text-[clamp(1.5rem,1.2rem+1.4vw,2.5rem)] leading-tight font-medium tracking-[-0.03em] text-ink">
                {Math.round(ai.ai_line_percent)}% of the lines changed were written with an assistant.
              </p>
              <div className="mt-8">
                <SplitBar
                  label={`${ai.ai_lines} lines with AI, ${ai.human_lines} by hand`}
                  parts={[
                    { name: "With AI", value: ai.ai_lines, slot: 0 },
                    { name: "By hand", value: ai.human_lines, slot: 2 },
                  ]}
                />
              </div>
              {ai.models.length > 0 && (
                <div className="mt-10">
                  <p className="text-[13px] text-mute">Models</p>
                  <div className="mt-4">
                    <RankBars entries={ai.models.slice(0, 5)} />
                  </div>
                </div>
              )}
            </div>
            <dl className="grid h-fit grid-cols-2 gap-x-6 gap-y-5 lg:col-span-4 lg:col-start-9">
              {[
                ["Prompts", ai.prompts, `about ${ai.prompt_avg} words each`],
                ["Sessions", String(ai.sessions), ""],
                ["Tokens in", ai.tokens_in, ai.tokens_in_exact],
                ["Tokens out", ai.tokens_out, ai.tokens_out_exact],
                ["Reviewed", ai.review_percent, ai.review_detail],
                ["Followed up", ai.follow_up_percent, ai.follow_up_detail],
                ["Spend", ai.spend, ""],
              ]
                .filter(([, value]) => value)
                .map(([label, value, detail]) => (
                  <div key={label} title={detail || undefined}>
                    <dt className="text-[13px] text-mute">{label}</dt>
                    <dd className="mt-1 text-[17px] text-ink tabular-nums">{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      )}
    </Panel>
  );
}

async function YearPanel() {
  const year = await getWakatimeYear(WAKATIME());
  if (!year) return null;
  return (
    <Panel id="year" title="A year at the keyboard" source="WakaTime" note={year.range}>
      <Readings
        className="mt-8"
        items={[
          { label: "In total", value: year.total },
          { label: "Per day", value: year.daily_average },
          {
            label: "Days at it",
            value: (
              <>
                <CountUp value={year.days_coded} />
                <span className="text-mute"> / {year.days_total}</span>
              </>
            ),
          },
          { label: "Best day", value: year.best_day, detail: year.best_day_date },
        ]}
      />
      <div className="mt-10">
        <Heatmap
          weeks={year.weeks}
          months={year.months}
          peak={year.peak_seconds}
          describe={(seconds) => (seconds ? formatTime(seconds) : "no coding")}
          label={`Coding time per day, ${year.range}`}
        />
      </div>
      <div className="mt-12 grid gap-12 md:grid-cols-3">
        {[
          ["Languages", year.languages],
          ["Projects", year.projects],
          ["Systems", year.systems],
        ].map(([label, entries]) => (
          <div key={label as string}>
            <p className="text-[13px] text-mute">{label as string}</p>
            <div className="mt-4">
              <RankBars entries={(entries as typeof year.languages).slice(0, 5)} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

async function RhythmPanel() {
  const rhythm = await getWakatimeRhythm(WAKATIME());
  if (!rhythm) return null;
  return (
    <Panel id="rhythm" title="The shape of a week" source="WakaTime">
      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <WeekColumns
            days={rhythm.weekdays}
            peakLabel={rhythm.peak_label}
            halfLabel={rhythm.half_label}
            label={`Average coding time per weekday. Busiest: ${rhythm.busiest}.`}
          />
          <div className="mt-5">
            <Key items={rhythm.categories} />
          </div>
        </div>
        <dl className="h-fit space-y-6 lg:col-span-4">
          <div title={rhythm.busiest_detail}>
            <dt className="text-[13px] text-mute">Busiest day</dt>
            <dd className="mt-1 text-[22px] font-medium tracking-[-0.02em] text-ink">{rhythm.busiest}</dd>
            <p className="mt-1 text-[14px] text-mute">{rhythm.busiest_detail}</p>
          </div>
          {rhythm.most_ai && (
            <div>
              <dt className="text-[13px] text-mute">Most help from AI</dt>
              <dd className="mt-1 text-[22px] font-medium tracking-[-0.02em] text-ink">{rhythm.most_ai}</dd>
              <p className="mt-1 text-[14px] text-mute">{rhythm.most_ai_detail}</p>
            </div>
          )}
        </dl>
      </div>

      {rhythm.has_trend && (
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[13px] text-mute">Share of lines written with AI, week by week</p>
            <p className="mt-3 text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] leading-none font-medium tracking-[-0.03em] text-ink">
              {rhythm.trend_now}
            </p>
            <p className="mt-3 text-[14px] text-mute">
              from {rhythm.trend_then}. {rhythm.trend_detail}
            </p>
          </div>
          <div className="lg:col-span-8">
            <TrendLine points={rhythm.trend} label={`AI share of lines, from ${rhythm.trend_then} to ${rhythm.trend_now}`} />
          </div>
        </div>
      )}

      {rhythm.has_comparison && (
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-[13px] text-mute">Against everyone else on WakaTime</p>
            <p className="mt-3 text-[clamp(1.75rem,1.3rem+2vw,2.75rem)] leading-none font-medium tracking-[-0.03em] text-ink">
              {rhythm.multiple.toLocaleString("en-US", { maximumFractionDigits: 1 })}×
            </p>
            <p className="mt-3 text-[14px] text-mute">the median developer&rsquo;s daily time.</p>
          </div>
          <div className="lg:col-span-8">
            <Bullet
              value={rhythm.you}
              valueLabel={`Me: ${rhythm.you_label}`}
              marks={[
                { at: rhythm.community_median, label: `median ${rhythm.community_median_label}` },
                { at: rhythm.community_average, label: `average ${rhythm.community_average_label}` },
              ]}
              label={`My daily average, ${rhythm.you_label}, against a median of ${rhythm.community_median_label}`}
            />
            <p className="fh-mono flex justify-between text-[11px] text-mute">
              <span>0</span>
              <span>Me: {rhythm.you_label}</span>
              <span>{rhythm.axis_label}</span>
            </p>
          </div>
        </div>
      )}
    </Panel>
  );
}

async function GitHubPanel({ username }: { username: string }) {
  const github = await getGitHubStats(username, process.env.GITHUB_ACCESS_TOKEN ?? "");
  if (!github) return null;
  const peak = Math.max(1, ...github.weeks.flatMap((week) => week.days.map((day) => day.value)));
  return (
    <Panel id="github" title="On GitHub" source="GitHub" note={`@${username}`}>
      <Readings
        className="mt-8"
        items={[
          { label: "Contributions this year", value: <CountUp value={github.total_contributions} /> },
          { label: "This week", value: <CountUp value={github.this_week} /> },
          {
            label: "Current streak",
            value: (
              <>
                <CountUp value={github.current_streak} />
                <span className="text-mute"> days</span>
              </>
            ),
            detail: github.current_streak_start && github.current_streak_end ? `${github.current_streak_start} to ${github.current_streak_end}` : undefined,
          },
          {
            label: "Longest streak",
            value: (
              <>
                <CountUp value={github.longest_streak} />
                <span className="text-mute"> days</span>
              </>
            ),
            detail: `best day ${github.best_day} · about ${github.average} a day`,
          },
        ]}
      />
      <div className="mt-10">
        <Heatmap
          weeks={github.weeks}
          months={github.months}
          peak={peak}
          describe={(count) => `${count} contribution${count === 1 ? "" : "s"}`}
          label={`GitHub contributions per day, ${github.total_contributions} in the last year`}
        />
      </div>
    </Panel>
  );
}
