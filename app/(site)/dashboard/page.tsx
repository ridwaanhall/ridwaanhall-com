import type { Metadata } from "next";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ActivityHeatmap } from "@/components/site/activity-heatmap";
import { DashboardPanelSkeleton } from "@/components/site/dashboard-skeleton";
import { CountUp, PercentBar, SplitBar } from "@/components/site/dashboard-sections";
import { getAboutData, type AboutData } from "@/lib/data/about";
import { getGitHubStats, type GitHubStats } from "@/lib/data/github";
import { getWakatimeStats, type WakatimeAi, type WakatimeStats } from "@/lib/data/wakatime";
import { getWakatimeYear, type WakatimeYear } from "@/lib/data/wakatime-year";
import { dashboardSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { dashboardSchemas } from "@/lib/seo/schemas-for-page";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(dashboardSeo(about), about);
}

export default async function DashboardPage() {
  const about = await getAboutData();
  if (!about) return null;

  return (
    <>
      <JsonLdScript schemas={await dashboardSchemas(about)} />
      <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
                  Dashboard
                </h1>
                <p className="mt-1 sm:mt-2 text-base sm:text-lg leading-relaxed">
                  Every line of code leaves a trace. This shows mine, from focused hours to
                  committed nights.
                </p>
              </div>
            </div>
          </div>

          {/*
            Each panel streams independently. They call third-party APIs, so
            none should hold up the page or the others -- and a panel whose API
            is down simply does not render, which is the degradation this page
            has always implemented.

            The alternative is a total time budget shared across the clients,
            which is what running them in sequence inside one request forces:
            three 10s timeouts sum to 30s, past the function limit, and the
            visitor sees a gateway timeout. Separate boundaries mean the page
            shell is already sent, so a slow API delays one panel rather than
            the whole request.
          */}
          <Suspense fallback={<DashboardPanelSkeleton panel="wakatime" />}>
            <WakatimePanel />
          </Suspense>

          {/*
            A third boundary rather than a section of the first. It is two more
            third-party calls, and the whole reason the panels are split is that
            a time budget shared across them is a budget that runs out.
          */}
          <Suspense fallback={<DashboardPanelSkeleton panel="year" />}>
            <CodingYearPanel />
          </Suspense>

          <Suspense fallback={<DashboardPanelSkeleton panel="github" />}>
            <GitHubPanel about={about} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function WakatimePanel() {
  const stats = await getWakatimeStats(process.env.WAKATIME_API_KEY ?? "");
  if (!stats) return null;
  return <Wakatime stats={stats} />;
}

async function CodingYearPanel() {
  const year = await getWakatimeYear(process.env.WAKATIME_API_KEY ?? "");
  if (!year) return null;
  return <CodingYear year={year} />;
}

async function GitHubPanel({ about }: { about: AboutData }) {
  const stats = await getGitHubStats(about.username, process.env.GITHUB_ACCESS_TOKEN ?? "");
  if (!stats) return null;
  return <GitHub stats={stats} />;
}

// ---------------------------------------------------------------------------

function Wakatime({ stats }: { stats: WakatimeStats }) {
  return (
    <div className="mb-6">
      <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
        <h2 className="text-xl font-medium">WakaTime Statistics</h2>
        <p className="text-xs sm:text-sm">Live Trace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
        <StatCard label="Begin Trace" value={stats.start_date} />
        <StatCard label="End Trace" value={stats.end_date} />
        <StatCard label="Daily Focus" value={stats.daily_average} />
        <StatCard label={<>Week&rsquo;s Coding</>} value={stats.this_week_coding} />
        <StatCard label="Peak Day" hint={stats.best_day_date} value={stats.best_day_coding} />
        <StatCard
          label="Today's Coding"
          hint={`${stats.all_time_coding} Since ${stats.all_time_start}`}
          value={
            <>
              {stats.today_coding}
              {stats.today_change_type !== "same" && (
                <span
                  className={`text-xs -ml-1 ${
                    stats.today_change_type === "increase" ? "text-green-500" : "text-red-500"
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3 h-3 inline"
                    aria-hidden="true"
                  >
                    <path
                      d={
                        stats.today_change_type === "increase"
                          ? "M7 17L17 7M17 7H7M17 7V17"
                          : "M17 7L7 17M7 17H17M7 17V7"
                      }
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {stats.today_change_percent}%
                </span>
              )}
            </>
          }
        />
      </div>

      {/*
        Three across from `lg`, stacked below it. Not `md:flex-row` like the
        pairs elsewhere on this page: three panels sharing a 768px row leaves
        each about 240px, which is narrower than "Writing Docs" beside a bar.
      */}
      <div className="mt-4 grid gap-6 sm:gap-4 lg:grid-cols-3">
        <GradientPanel title="Top Languages" gradient="from-indigo-400 to-purple-600">
          {stats.top_3_languages.length > 0 ? (
            stats.top_3_languages.map((language) => (
              <PercentBar
                key={language.name}
                entry={language}
                gradient="bg-gradient-to-r from-indigo-400 to-purple-600"
              />
            ))
          ) : (
            <EmptyRow>No language data available</EmptyRow>
          )}
        </GradientPanel>

        <GradientPanel title="Top Categories" gradient="from-purple-500 to-pink-600">
          {stats.top_3_categories.length > 0 ? (
            stats.top_3_categories.map((category) => (
              <PercentBar
                key={category.name}
                entry={category}
                gradient="bg-gradient-to-r from-purple-500 to-pink-600"
              />
            ))
          ) : (
            <EmptyRow>No category data available</EmptyRow>
          )}
        </GradientPanel>

        <GradientPanel title="Top Editors" gradient="from-pink-500 to-rose-600">
          {stats.top_3_editors.length > 0 ? (
            stats.top_3_editors.map((editor) => (
              <PercentBar
                key={editor.name}
                entry={editor}
                gradient="bg-gradient-to-r from-pink-500 to-rose-600"
              />
            ))
          ) : (
            <EmptyRow>No editor data available</EmptyRow>
          )}
        </GradientPanel>
      </div>

      <AiAnalytics ai={stats.ai} />
    </div>
  );
}

/**
 * The AI half of the WakaTime panel.
 *
 * Inside the same block rather than a section of its own: it is the same seven
 * days, cut a different way, and a reader who scrolls past the categories has
 * not left WakaTime's numbers behind.
 *
 * Its own accent all the same. Sharing indigo with the panel above it made one
 * long indigo run where the heading was the only thing saying the subject had
 * changed, and a heading is what a reader scrolling scans past. Amber is warm
 * against the three cool sections -- indigo above, teal below, green under
 * that -- so the eye counts four scales down the page rather than two.
 *
 * Four of the six figures here come from the AI heuristics call, which
 * `lib/data/wakatime.ts` lets fail on its own. `has_heuristics` is what they
 * are gated on rather than their own values: a week with no follow-ups is a
 * real 0%, and testing for emptiness would read it as an outage.
 */
function AiAnalytics({ ai }: { ai: WakatimeAi }) {
  return (
    <div className="mt-6">
      <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
        <h2 className="text-xl font-medium">AI Coding Analytics</h2>
        <p className="text-xs sm:text-sm">Last 7 Days</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <AiStat
          label="Tokens In"
          hint={`${ai.tokens_in_exact}. ${ai.ai_line_percent}% of lines changed were written by AI.`}
          value={ai.tokens_in}
        />
        <AiStat label="Tokens Out" hint={ai.tokens_out_exact} value={ai.tokens_out} />
        <AiStat label="Prompts" hint={`Averaging ${ai.prompt_avg} each`} value={ai.prompts} />
        <AiStat label="Avg Prompt" value={ai.prompt_avg} />
        {ai.has_heuristics && (
          <>
            {/*
              Spend and sessions come from the heuristics aggregate, so they
              share the gate with the two review figures below rather than
              carrying one each. A week that cost nothing is a real $0; an
              outage is not, and only the flag can tell them apart.
            */}
            <AiStat
              label="Est. Spend"
              hint="What the week's AI models cost, as WakaTime estimates it"
              value={ai.spend}
            />
            <AiStat label="AI Sessions" value={ai.sessions} />
            <AiStat
              label="Human Review"
              hint={ai.review_detail}
              value={
                <>
                  {ai.review_percent}{" "}
                  <span className="text-xs text-zinc-400">({ai.review_sessions} sessions)</span>
                </>
              }
            />
            <AiStat
              label="Human Follow-up"
              hint={ai.follow_up_detail}
              value={
                <>
                  {ai.follow_up_percent}{" "}
                  <span className="text-xs text-zinc-400">({ai.follow_up_sessions} sessions)</span>
                </>
              }
            />
          </>
        )}
      </div>

      {/*
        The split the section is actually about. It was computed and then spent
        entirely on the Tokens In tooltip, which is the one place a reader who
        wanted it would not look.
      */}
      <SplitBar
        leftLabel="AI"
        leftValue={`${ai.ai_lines.toLocaleString("en-US")} lines`}
        rightLabel="Human"
        rightValue={`${ai.human_lines.toLocaleString("en-US")} lines`}
        percent={ai.ai_line_percent}
        gradient="bg-gradient-to-r from-yellow-400 to-amber-600"
        border="border-amber-500/50"
      />

      <div className="mt-4 flex flex-col gap-6 sm:gap-4 md:flex-row">
        <GradientPanel title="Cost by Model" gradient="from-yellow-400 to-amber-600">
          {ai.models.length > 0 ? (
            ai.models.map((model) => (
              <PercentBar
                key={model.name}
                entry={model}
                gradient="bg-gradient-to-r from-yellow-400 to-amber-600"
              />
            ))
          ) : (
            <EmptyRow>No model cost data available</EmptyRow>
          )}
        </GradientPanel>

        <GradientPanel title="AI Lines by Project" gradient="from-amber-500 to-orange-600">
          {ai.projects.length > 0 ? (
            ai.projects.map((project) => (
              <PercentBar
                key={project.name}
                entry={project}
                gradient="bg-gradient-to-r from-amber-500 to-orange-600"
              />
            ))
          ) : (
            <EmptyRow>No project data available</EmptyRow>
          )}
        </GradientPanel>
      </div>
    </div>
  );
}

/**
 * The year beneath the week.
 *
 * Its own section rather than more cards in the WakaTime one: every figure
 * above it is seven days old at most, and putting a year-long total in that
 * grid would leave the reader to notice the difference from the wording alone.
 * Its own accent for the same reason -- teal between the amber above and the
 * green below, so the eye reads four scales rather than one long panel.
 *
 * The heatmap is the same grid GitHub renders underneath, in the other tone.
 * That is the point of it: hours and commits over the same year, drawn the
 * same way, one above the other.
 */
function CodingYear({ year }: { year: WakatimeYear }) {
  return (
    <div className="mb-6">
      <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
        <h2 className="text-xl font-medium">Coding Year</h2>
        <p className="text-xs sm:text-sm">Last Year</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <YearStat label="Total Coded" hint={year.range} value={year.total} />
        <YearStat label="Daily Focus" value={year.daily_average} />
        <YearStat label="Peak Day" hint={year.best_day_date} value={year.best_day} />
        <YearStat
          /* WakaTime counts the days you did not code and calls them holidays. */
          label="Days Coded"
          hint={`${year.days_total - year.days_coded} days with no coding on them`}
          value={
            <>
              {year.days_coded}{" "}
              <span className="text-xs text-zinc-400">of {year.days_total}</span>
            </>
          }
        />

        <YearStat label="AI Spend" hint="Estimated across the year" value={year.ai_spend} />
        <YearStat label="AI Sessions" value={year.ai_sessions} />
        <YearStat label="Prompts" hint={`Averaging ${year.ai_prompt_avg} each`} value={year.ai_prompts} />
        <YearStat label="Tokens" hint={year.tokens_exact} value={year.tokens} />
      </div>

      <SplitBar
        leftLabel="AI"
        leftValue={`${year.ai_lines} lines`}
        rightLabel="Human"
        rightValue={`${year.human_lines} lines`}
        percent={year.ai_line_percent}
        gradient="bg-gradient-to-r from-teal-400 to-cyan-600"
        border="border-cyan-500/50"
      />

      <ActivityHeatmap
        weeks={year.weeks}
        months={year.months}
        tone="teal"
        unit="hours"
        label="Coding hours for the past year"
      />

      <div className="mt-4 grid gap-6 sm:gap-4 lg:grid-cols-3">
        <GradientPanel title="Top Languages" gradient="from-teal-400 to-cyan-600">
          {year.languages.length > 0 ? (
            year.languages.map((language) => (
              <PercentBar
                key={language.name}
                entry={language}
                gradient="bg-gradient-to-r from-teal-400 to-cyan-600"
              />
            ))
          ) : (
            <EmptyRow>No language data available</EmptyRow>
          )}
        </GradientPanel>

        <GradientPanel title="Top Projects" gradient="from-cyan-500 to-sky-600">
          {year.projects.length > 0 ? (
            year.projects.map((project) => (
              <PercentBar
                key={project.name}
                entry={project}
                gradient="bg-gradient-to-r from-cyan-500 to-sky-600"
              />
            ))
          ) : (
            <EmptyRow>No project data available</EmptyRow>
          )}
        </GradientPanel>

        <GradientPanel title="Systems" gradient="from-sky-400 to-teal-600">
          {year.systems.length > 0 ? (
            year.systems.map((system) => (
              <PercentBar
                key={system.name}
                entry={system}
                gradient="bg-gradient-to-r from-sky-400 to-teal-600"
              />
            ))
          ) : (
            <EmptyRow>No system data available</EmptyRow>
          )}
        </GradientPanel>
      </div>
    </div>
  );
}

function GitHub({ stats }: { stats: GitHubStats }) {
  const streakRange =
    stats.current_streak_start && stats.current_streak_end
      ? `${shortDate(stats.current_streak_start)} - ${shortDate(stats.current_streak_end)}`
      : "No active streak";

  return (
    <div className="mb-6">
      <div className="flex flex-row items-center justify-between mb-3 md:mb-4 gap-2">
        <h2 className="text-xl font-medium">GitHub Statistics</h2>
        {/*
          The window, not the account. Every other section here says what
          period it covers, and the calendar below is the twelve months
          GitHub's `contributionCalendar` returns when asked for no range.
          The handle it used to carry said nothing the sidebar does not.
        */}
        <p className="text-xs sm:text-sm">Last Year</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GitHubStat label="Total" value={stats.total_contributions} />
        <GitHubStat label="This Week" value={stats.this_week} />
        <GitHubStat
          label="Current Streak"
          value={stats.current_streak}
          labelHint={`${stats.longest_streak} days longest streak`}
          suffix={
            <span className="text-sm text-zinc-400">
              days <HelpIcon title={streakRange} />
            </span>
          }
        />
        <GitHubStat
          label="Average"
          value={stats.average}
          suffix={<span className="text-sm text-zinc-400">/day</span>}
        />
      </div>

      <ActivityHeatmap
        weeks={stats.weeks}
        months={stats.months}
        tone="green"
        unit="contributions"
        label="GitHub contribution calendar for the past year"
      />
    </div>
  );
}

// --- building blocks -------------------------------------------------------

function StatCard({
  label,
  value,
  hint,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div
      className={`bg-transparent backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-indigo-500/50 transition-all duration-300 ${
        hint ? "relative z-10 overflow-visible" : "overflow-hidden"
      }`}
    >
      <h3 className="font-medium text-xs sm:text-sm">
        {label}
        {hint && <HelpIcon title={hint} />}
      </h3>
      <div className="flex items-center justify-between">
        <p className="text-indigo-400 sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

/**
 * A card in the AI section.
 *
 * `StatCard` in amber, and a separate component for the same reason `YearStat`
 * is one: Tailwind emits a class only where it can see it written out, so a
 * border colour interpolated from a `tone` prop produces no rule at all and
 * the card comes out unbordered.
 */
function AiStat({
  label,
  value,
  hint,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div
      className={`bg-transparent backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-amber-500/50 transition-all duration-300 ${
        hint ? "relative z-10 overflow-visible" : "overflow-hidden"
      }`}
    >
      <h3 className="font-medium text-xs sm:text-sm">
        {label}
        {hint && <HelpIcon title={hint} />}
      </h3>
      <div className="flex items-center justify-between">
        <p className="text-amber-400 sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

/**
 * A card in the year section.
 *
 * `StatCard` in another colour, and a separate component rather than a
 * `tone` prop on it: Tailwind generates a class only where it can see one
 * written out, so a border interpolated from a prop would produce no rule at
 * all and the card would come out unbordered.
 */
function YearStat({
  label,
  value,
  hint,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div
      className={`bg-transparent backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-cyan-500/50 transition-all duration-300 ${
        hint ? "relative z-10 overflow-visible" : "overflow-hidden"
      }`}
    >
      <h3 className="font-medium text-xs sm:text-sm">
        {label}
        {hint && <HelpIcon title={hint} />}
      </h3>
      <div className="flex items-center justify-between">
        <p className="text-cyan-400 sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

function GitHubStat({
  label,
  value,
  labelHint,
  suffix,
}: {
  label: string;
  value: number | string;
  labelHint?: string;
  suffix?: React.ReactNode;
}) {
  return (
    <div
      className={`bg-transparent backdrop-blur-sm rounded-lg sm:rounded-xl px-3 py-2 border border-green-500/50 transition-all duration-300 ${
        labelHint || suffix ? "relative z-10 overflow-visible" : "overflow-hidden"
      }`}
    >
      <h3 className="font-medium text-xs sm:text-sm">
        {label}
        {labelHint && <HelpIcon title={labelHint} />}
      </h3>
      <div className="flex items-center justify-between">
        <p className="text-xl sm:text-2xl md:text-2xl">
          <CountUp value={value} className="text-green-600" />
          {suffix}
        </p>
      </div>
    </div>
  );
}

function GradientPanel({
  title,
  gradient,
  children,
}: {
  title: string;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-gradient-to-r ${gradient} relative flex flex-1 flex-col gap-2 rounded-lg sm:rounded-xl p-[2px]`}
    >
      <div className="h-full w-full rounded-lg sm:rounded-xl bg-black p-3 sm:p-4">
        <h3 className="absolute -top-3 left-3 bg-black px-2">{title}</h3>
        {/*
          The rows share these tracks through `grid-cols-subgrid`, which is what
          lets a panel size its label column to its own longest name instead of
          to a number picked in advance.

          `fit-content(50%)` is the rule in one function: the column takes the
          width of the widest label, unless that would pass half the panel, at
          which point it stops there and that label wraps over two lines. It is
          written as a style rather than an arbitrary class because a class
          carrying parentheses and a percent sign is exactly what the
          `@source not` lines in globals.css exist to keep out of the scan.
        */}
        <ul
          className="grid gap-3 px-1 py-1"
          style={{ gridTemplateColumns: "fit-content(50%) 1fr auto" }}
        >
          {children}
        </ul>
      </div>
    </div>
  );
}

/** `col-span-3` because it shares the `<ul>` with the rows and their three tracks. */
function EmptyRow({ children }: { children: React.ReactNode }) {
  return <li className="col-span-3 text-center text-zinc-400 text-sm py-4">{children}</li>;
}

/**
 * The "?" affordance beside a stat.
 *
 * A `title`, never a `group-hover` chip: a chip is hover-only and so
 * unreachable on touch, which is precisely the bug the tooltip handler exists
 * to fix.
 */
function HelpIcon({ title }: { title: string }) {
  return (
    <span className="cursor-help inline-block align-middle" title={title}>
      <svg
        fill="currentColor"
        className="w-3 h-3 text-zinc-400 hover:text-zinc-300 transition-colors"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path d="M21.36 28.05V22.8l1.79-.1c2.33-.1 3.87-1.36 3.87-3.31s-1.31-3-3.33-3c-1.95 0-3.53.95-3.88 3.1l-4.31-.7c.54-3.98 3.78-6.28 8.54-6.28 4.5 0 7.66 2.66 7.66 6.75 0 3.3-2.18 5.66-5.58 6.3v2.5h-4.76ZM20.62 32.72a2.99 2.99 0 0 1 3.07-3.04 2.96 2.96 0 0 1 3.04 3.04c0 1.7-1.28 3.01-3.04 3.01a2.98 2.98 0 0 1-3.07-3Z" />
        <path d="M2 24a22 22 0 1 1 44 0 22 22 0 0 1-44 0Zm22 18a18 18 0 1 0 0-36 18 18 0 0 0 0 36Z" />
      </svg>
    </span>
  );
}

/** "Aug 20, 2026". */
function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));
}
