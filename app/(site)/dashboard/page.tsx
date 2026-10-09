import type { Metadata } from "next";
import { Suspense } from "react";

import { Bars, Compare, EmptyTrack, fillOf, Kpi, Legend, Spark, Split, Timeline, WeekColumns } from "@/components/foothill/charts/boxes";
import { EditorPanel, type EditorRange } from "@/components/foothill/charts/editor-panel";
import { FeedDown } from "@/components/foothill/charts/feed-down";
import { Heatmap } from "@/components/foothill/charts/heatmap";
import { Brand } from "@/components/foothill/icons";
import { MAIN } from "@/components/foothill/layout";
import { Animate, PageMotion } from "@/components/foothill/motion";
import { InlineSkeleton, PanelSkeleton } from "@/components/foothill/skeleton";
import { Empty, PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData } from "@/lib/data/about";
import { getGitHubStats } from "@/lib/data/github";
import { getWakatimeStats, type WakatimeStats } from "@/lib/data/wakatime";
import { getWakatimeDay } from "@/lib/data/wakatime-day";
import { formatTime } from "@/lib/data/wakatime-format";
import { getWakatimeRhythm } from "@/lib/data/wakatime-rhythm";
import { getWakatimeYear, type WakatimeYear } from "@/lib/data/wakatime-year";
import { dashboardSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { dashboardSchemas } from "@/lib/seo/schemas-for-page";
import { heatGrid } from "@/lib/site/heat";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(dashboardSeo(about), about);
}

const WAKATIME = () => process.env.WAKATIME_API_KEY ?? "";

/**
 * The work, measured: nine panels, each streamed on its own.
 *
 * Every panel waits on its own `<Suspense>` because each is its own upstream
 * call with its own cache lifetime, and one slow API should hold up only the
 * readings it feeds. A source that does not answer says so in its own panels,
 * with Try again; the rest of the page is unaffected.
 */
export default async function DashboardPage() {
  const about = await getAboutData();
  if (!about) return null;

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={await dashboardSchemas(about)} />
      <div>
        <PageHead
          title="The work, measured."
          lead="Time in the editor from WakaTime and contributions from GitHub, read live. Nothing here is typed in by hand."
          markdown="/dashboard"
          facts={[
            ["Editor time", "WakaTime"],
            [
              "Contributions",
              <a key="gh" className="ul" href={`https://github.com/${about.username}`} target="_blank" rel="noopener noreferrer">
                @{about.username}
              </a>,
            ],
            // The panels' cache lifetimes in lib/data: fifteen minutes for
            // today and GitHub, an hour for the year and the rhythm.
            ["Refreshed", "Every 15 minutes"],
          ]}
        />
        <div className="wrap dash">
          <Suspense fallback={<Waiting heights={[150]} phone={560} />}>
            <TodayPanel />
          </Suspense>
          <Suspense fallback={<Waiting heights={[260]} />}>
            <EditorPanels />
          </Suspense>
          <Suspense fallback={<Waiting heights={[200, 200]} two />}>
            <AiPanels />
          </Suspense>
          <Suspense fallback={<Waiting heights={[320]} />}>
            <YearPanel />
          </Suspense>
          <Suspense fallback={<Waiting heights={[300]} />}>
            <RhythmPanels />
          </Suspense>
          <Suspense fallback={<Waiting heights={[260]} />}>
            <GitHubPanel username={about.username} />
          </Suspense>
          <p className="meta">Every figure here is read from WakaTime and GitHub as they report it; nothing is typed in by hand.</p>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

/** A panel's frame while its source answers. */
function Waiting({ heights, two, phone }: { heights: number[]; two?: boolean; phone?: number }) {
  const panels = heights.map((h, i) => <PanelSkeleton key={i} h={h} phone={phone} />);
  return <InlineSkeleton label="Loading a panel">{two ? <div className="dgrid two">{panels}</div> : panels}</InlineSkeleton>;
}

/**
 * A titled box. Its charts are drawn for the eye and hidden from a screen
 * reader, which reads `summary`, one sentence, in their place; the figures
 * and their labels stay readable as text.
 */
function Panel({
  title,
  sub,
  summary,
  right,
  children,
}: {
  title: string;
  sub?: string;
  summary: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="panel" aria-label={title}>
      <div className="panel-h">
        <div>
          <h3>{title}</h3>
          {sub && <p className="meta">{sub}</p>}
        </div>
        {right}
      </div>
      <p className="sr">{summary}</p>
      <Animate>{children}</Animate>
    </section>
  );
}

function Down({ title, source }: { title: string; source: string }) {
  return (
    <section className="panel" aria-label={title}>
      <div className="panel-h">
        <h3>{title}</h3>
      </div>
      <div className="panel-b">
        <FeedDown source={source} />
      </div>
    </section>
  );
}

async function TodayPanel() {
  const day = await getWakatimeDay(WAKATIME());
  if (!day) return <Down title="Today, so far" source="WakaTime" />;
  const sub = `${day.date} · via WakaTime`;
  if (!day.has_activity)
    return (
      <Panel title="Today, so far" sub={sub} summary="No sessions yet today.">
        <div className="panel-b">
          <EmptyTrack label="No sessions yet" />
          <p className="meta" style={{ marginTop: 14 }}>
            The day starts at the first save in the editor.
          </p>
        </div>
        <div className="kpis k3" style={{ borderTop: "1px solid var(--fh-line)" }}>
          {["In the editor", "Sessions", "Longest", "Window", "Longest break", "Busiest hour"].map((label) => (
            <Kpi key={label} label={label} value={<span className="mute">{label === "Sessions" ? "0" : label === "In the editor" ? "0m" : "–"}</span>} />
          ))}
        </div>
      </Panel>
    );
  return (
    <Panel
      title="Today, so far"
      sub={sub}
      summary={`${day.total} in the editor today across ${day.sessions} sessions, from ${day.active_window}. The longest stretch was ${day.longest_session}.`}
    >
      <div className="panel-b">
        <Timeline blocks={day.blocks} />
        <div style={{ marginTop: 14 }}>
          <Legend items={day.languages.map((language) => ({ fill: fillOf(language.slot), label: `${language.name} ${language.time}` }))} />
        </div>
      </div>
      <div className="kpis k3" style={{ borderTop: "1px solid var(--fh-line)" }}>
        <Kpi label="In the editor" value={day.total} />
        <Kpi label="Sessions" value={day.sessions} tip="A session ends after 15 minutes without a keystroke" />
        <Kpi label="Longest" value={day.longest_session} tip="The longest run without a 15-minute break" />
        <Kpi label="Window" value={day.active_window} tip="First and last activity of the day, GMT+7" />
        <Kpi label="Longest break" value={day.longest_break} />
        <Kpi label="Busiest hour" value={day.peak_hour} tip={day.peak_hour_detail || undefined} />
      </div>
    </Panel>
  );
}

function weekRange(stats: WakatimeStats): EditorRange {
  const change =
    stats.today_change_type === "same"
      ? "level with yesterday"
      : `${Math.abs(Math.round(stats.today_change_percent))}% ${stats.today_change_type === "increase" ? "up on" : "down on"} yesterday`;
  return {
    sub: `${stats.start_date} to ${stats.end_date} · via WakaTime`,
    summary: `${stats.this_week_coding} in the editor this week, and ${stats.daily_average} on an average day.${
      stats.top_3_languages[0] ? ` ${stats.top_3_languages[0].name} leads at ${Math.round(stats.top_3_languages[0].percent)}%.` : ""
    }`,
    kpis: [
      { label: "Since I started", value: stats.all_time_coding, sub: `since ${stats.all_time_start}` },
      { label: "On an average day", value: stats.daily_average, tip: "Total time divided by the days with any activity" },
      { label: "This week", value: stats.this_week_coding },
      { label: "Today", value: stats.today_coding, sub: change },
    ],
    note: stats.best_day_coding ? `Best day: ${stats.best_day_coding} on ${stats.best_day_date}` : undefined,
    bars: [
      { title: "Languages", entries: stats.top_3_languages },
      { title: "Doing", entries: stats.top_3_categories },
      { title: "Editors", entries: stats.top_3_editors },
    ],
  };
}

function yearRange(year: WakatimeYear): EditorRange {
  return {
    sub: `${year.range} · via WakaTime`,
    summary: `${year.total} in the editor over the year, on ${year.days_coded} of ${year.days_total} days.${
      year.languages[0] ? ` ${year.languages[0].name} leads at ${Math.round(year.languages[0].percent)}%.` : ""
    }`,
    kpis: [
      { label: "In total", value: year.total },
      { label: "Per day", value: year.daily_average, tip: "Averaged over the days with any activity" },
      { label: "Days at it", value: `${year.days_coded} / ${year.days_total}` },
      { label: "Best day", value: year.best_day, sub: year.best_day_date },
    ],
    bars: [
      { title: "Languages", entries: year.languages },
      { title: "Projects", entries: year.projects },
      { title: "Systems", entries: year.systems },
    ],
  };
}

async function EditorPanels() {
  const [stats, year] = await Promise.all([getWakatimeStats(WAKATIME()), getWakatimeYear(WAKATIME())]);
  if (!stats && !year) return <Down title="In the editor" source="WakaTime" />;
  return <EditorPanel week={stats ? weekRange(stats) : null} year={year ? yearRange(year) : null} />;
}

async function AiPanels() {
  const stats = await getWakatimeStats(WAKATIME());
  if (!stats)
    return (
      <div className="dgrid two">
        <Down title="Working with AI" source="The AI usage feed" />
        <Down title="Usage" source="The AI usage feed" />
      </div>
    );
  const ai = stats.ai;
  const lines = ai.ai_lines + ai.human_lines;
  const percent = Math.round(ai.ai_line_percent);
  return (
    <div className="dgrid two">
      <Panel
        title="Working with AI"
        sub="This week"
        summary={
          lines
            ? `${ai.ai_lines.toLocaleString("en-US")} of ${lines.toLocaleString("en-US")} lines changed this week were written with an assistant, ${percent}%.`
            : "No lines changed this week."
        }
      >
        {lines ? (
          <div className="panel-b" style={{ display: "grid", gap: 22 }}>
            <p className="t2" style={{ fontFamily: "var(--fh-display)", maxWidth: "18ch" }}>
              {percent}% of the lines changed were written with an assistant.
            </p>
            <Split
              parts={[
                { value: ai.ai_lines, fill: "f1", tip: `With AI: ${ai.ai_lines.toLocaleString("en-US")} lines` },
                { value: ai.human_lines, fill: "f4", tip: `By hand: ${ai.human_lines.toLocaleString("en-US")} lines` },
              ]}
            />
            <Legend
              items={[
                { fill: "f1", label: `With AI ${ai.ai_lines.toLocaleString("en-US")} · ${percent}%` },
                { fill: "f4", label: `By hand ${ai.human_lines.toLocaleString("en-US")} · ${100 - percent}%` },
              ]}
            />
            <Bars title="Models" entries={ai.models.slice(0, 3)} />
          </div>
        ) : (
          <div className="panel-b">
            <EmptyTrack label="No lines changed this week" height={34} />
            <div style={{ marginTop: 16 }}>
              <Empty small icon="spark" title="No AI-assisted work this week" note="The split between lines written with an assistant and by hand appears after the first change." />
            </div>
          </div>
        )}
      </Panel>
      <Panel
        title="Usage"
        sub="This week"
        summary={`This week: ${ai.prompts} prompts over ${ai.sessions} sessions; ${ai.tokens_in} tokens in and ${ai.tokens_out} out${ai.spend ? `; an estimated ${ai.spend}` : ""}.`}
      >
        <div className="kpis">
          <Kpi label="Prompts" value={ai.prompts} tip={ai.prompt_avg ? `About ${ai.prompt_avg} each` : undefined} />
          <Kpi label="Sessions" value={ai.sessions} />
          <Kpi label="Tokens in" value={ai.tokens_in} tip="Tokens sent to the model, cached context included" />
          <Kpi label="Tokens out" value={ai.tokens_out} tip="Tokens the model wrote back" />
          {ai.has_heuristics && (
            <>
              <Kpi label="Reviewed" value={ai.review_percent} tip={ai.review_detail || "Share of suggestions read before they were accepted"} />
              <Kpi label="Followed up" value={ai.follow_up_percent} tip={ai.follow_up_detail || "Share of answers that needed a correction"} />
              <Kpi label="Spend" value={ai.spend} tip="Estimated from public per-token prices" />
              <div />
            </>
          )}
        </div>
      </Panel>
    </div>
  );
}

async function YearPanel() {
  const year = await getWakatimeYear(WAKATIME());
  if (!year) return <Down title="A year at the keyboard" source="WakaTime" />;
  const grid = heatGrid(year.weeks, year.months, year.peak_seconds, formatTime);
  return (
    <Panel
      title="A year at the keyboard"
      sub={`${year.range} · via WakaTime`}
      summary={`${year.total} over the year, on ${year.days_coded} of ${year.days_total} days, ${year.daily_average} a day on average. The best day was ${year.best_day_date}, at ${year.best_day}.`}
    >
      <div className="kpis k4">
        <Kpi label="In total" value={year.total} />
        <Kpi label="Per day" value={year.daily_average} tip="Averaged over the days with any activity" />
        <Kpi label="Days at it" value={`${year.days_coded} / ${year.days_total}`} />
        <Kpi label="Best day" value={year.best_day} sub={year.best_day_date} />
      </div>
      <div className="panel-b" style={{ borderBottom: "1px solid var(--fh-line)" }}>
        <Heatmap cells={grid.cells} months={grid.months} empty="No days recorded yet" />
      </div>
      <div className="panel-b dgrid three">
        <Bars title="Languages" entries={year.languages} />
        <Bars title="Projects" entries={year.projects} />
        <Bars title="Systems" entries={year.systems} />
      </div>
    </Panel>
  );
}

async function RhythmPanels() {
  const rhythm = await getWakatimeRhythm(WAKATIME());
  if (!rhythm) return <Down title="The shape of a week" source="WakaTime" />;
  return (
    <>
      <Panel
        title="The shape of a week"
        sub="Average day of the week · via WakaTime"
        summary={`${rhythm.busiest} is the busiest day. ${rhythm.busiest_detail}${rhythm.most_ai ? ` ${rhythm.most_ai_detail}` : ""}`}
      >
        <div className="panel-b dgrid two">
          <div>
            <WeekColumns
              days={rhythm.weekdays.map((day) => ({
                short: day.short,
                height: day.height,
                detail: day.detail,
                segments: day.segments.map((segment) => ({
                  name: segment.name,
                  percent: segment.percent,
                  slot: segment.slot,
                  tip: `${day.name} · ${segment.name} · ${formatTime((segment.percent / 100) * day.average_seconds)}`,
                })),
              }))}
            />
            <div style={{ marginTop: 14 }}>
              <Legend items={rhythm.categories.map((category) => ({ fill: fillOf(category.slot), label: category.name }))} />
            </div>
          </div>
          <div style={{ display: "grid", gap: 20, alignContent: "start" }}>
            <div>
              <span className="meta">Busiest day</span>
              <p className="t2" style={{ fontFamily: "var(--fh-display)" }}>
                {rhythm.busiest}
              </p>
              <p className="meta">{rhythm.busiest_detail}</p>
            </div>
            {rhythm.most_ai && (
              <div>
                <span className="meta">Most help from AI</span>
                <p className="t2" style={{ fontFamily: "var(--fh-display)" }}>
                  {rhythm.most_ai}
                </p>
                <p className="meta">{rhythm.most_ai_detail}</p>
              </div>
            )}
          </div>
        </div>
      </Panel>
      {(rhythm.has_trend || rhythm.has_comparison) && (
        <div className="dgrid two">
          {rhythm.has_trend ? (
            <Panel
              title="Share of lines written with AI"
              sub="Week by week"
              summary={`The share of lines written with AI went from ${rhythm.trend_then} to ${rhythm.trend_now}. ${rhythm.trend_detail}`}
            >
              <div className="panel-b">
                <p className="t2" style={{ fontFamily: "var(--fh-display)" }}>
                  {rhythm.trend_now}
                </p>
                <p className="meta">
                  From {rhythm.trend_then}. {rhythm.trend_detail}
                </p>
                <Spark points={rhythm.trend} />
              </div>
            </Panel>
          ) : (
            <div />
          )}
          {rhythm.has_comparison ? (
            <Panel
              title="Against everyone else"
              sub="On WakaTime"
              summary={`${rhythm.you_label} a day, ${rhythm.multiple.toLocaleString("en-US", { maximumFractionDigits: 1 })} times the median developer's ${rhythm.community_median_label}.`}
            >
              <div className="panel-b">
                <p className="t2" style={{ fontFamily: "var(--fh-display)" }}>
                  {rhythm.multiple.toLocaleString("en-US", { maximumFractionDigits: 1 })}×
                </p>
                <p className="meta">the median developer&rsquo;s daily time.</p>
                <Compare
                  axis={rhythm.axis_label}
                  rows={[
                    { label: "Median", value: rhythm.community_median, text: rhythm.community_median_label, fill: "f3" },
                    { label: "Average", value: rhythm.community_average, text: rhythm.community_average_label, fill: "f2" },
                    { label: "Me", value: rhythm.you, text: rhythm.you_label, fill: "f1" },
                  ]}
                />
              </div>
            </Panel>
          ) : (
            <div />
          )}
        </div>
      )}
    </>
  );
}

async function GitHubPanel({ username }: { username: string }) {
  const github = await getGitHubStats(username, process.env.GITHUB_ACCESS_TOKEN ?? "");
  if (!github) return <Down title="On GitHub" source="GitHub" />;
  const peak = Math.max(1, ...github.weeks.flatMap((week) => week.days.map((day) => day.value)));
  const grid = heatGrid(github.weeks, github.months, peak, (count) => `${count} contribution${count === 1 ? "" : "s"}`);
  return (
    <Panel
      title="On GitHub"
      summary={`${github.total_contributions.toLocaleString("en-US")} contributions this year and ${github.this_week} this week. The current streak is ${github.current_streak} days; the longest was ${github.longest_streak}.`}
      right={
        <a className="tl" href={`https://github.com/${username}`} target="_blank" rel="noopener noreferrer">
          <Brand name="github" size={15} />
          <span>@{username}</span>
        </a>
      }
    >
      <div className="kpis k4">
        <Kpi label="Contributions this year" value={github.total_contributions.toLocaleString("en-US")} />
        <Kpi label="This week" value={github.this_week} />
        <Kpi
          label="Current streak"
          value={`${github.current_streak} days`}
          sub={github.current_streak_start && github.current_streak_end ? `${github.current_streak_start} to ${github.current_streak_end}` : undefined}
        />
        <Kpi label="Longest streak" value={`${github.longest_streak} days`} sub={`best day ${github.best_day} · about ${github.average} a day`} />
      </div>
      <div className="panel-b">
        <Heatmap cells={grid.cells} months={grid.months} empty="No contributions yet" />
      </div>
    </Panel>
  );
}
