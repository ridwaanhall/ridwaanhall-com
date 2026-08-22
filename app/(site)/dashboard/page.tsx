import type { Metadata } from "next";
import { Suspense } from "react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContributionHeatmap } from "@/components/site/contribution-heatmap";
import { CountUp, PercentBar } from "@/components/site/dashboard-sections";
import { getAboutData, type AboutData } from "@/lib/data/about";
import { getGitHubStats, type GitHubStats } from "@/lib/data/github";
import { getWakatimeStats, type WakatimeStats } from "@/lib/data/wakatime";
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
            Both panels stream independently. They call third-party APIs, so
            neither should hold up the page or the other -- and a panel whose API
            is down simply does not render, which is the degradation this page
            has always implemented.

            This replaces Django's `EXTERNAL_API_BUDGET`. That existed because
            the two clients ran in sequence inside one request: three 10s
            timeouts summed to 30s, past the function limit, which the visitor
            saw as a gateway timeout. Separate boundaries mean the page shell is
            already sent, so a slow API delays one panel rather than the request.
          */}
          <Suspense fallback={<PanelSkeleton columns={2} />}>
            <WakatimePanel />
          </Suspense>

          <Suspense fallback={<PanelSkeleton columns={4} />}>
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

async function GitHubPanel({ about }: { about: AboutData }) {
  const stats = await getGitHubStats(about.username, process.env.GITHUB_ACCESS_TOKEN ?? "");
  if (!stats) return null;
  return <GitHub stats={stats} about={about} />;
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
        <StatCard
          label="Peak Day"
          value={
            <>
              {stats.best_day_coding}{" "}
              <span className="text-xs text-zinc-400">({stats.best_day_date})</span>
            </>
          }
        />
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

      <div className="mt-4 flex flex-col gap-6 sm:gap-4 md:flex-row">
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

        <GradientPanel title="Category & OS" gradient="from-purple-500 to-pink-600">
          {stats.top_1_category || stats.top_2_os.length > 0 ? (
            <>
              {stats.top_1_category && (
                <PercentBar
                  entry={stats.top_1_category}
                  gradient="bg-gradient-to-r from-purple-500 to-pink-600"
                />
              )}
              {stats.top_2_os.map((os) => (
                <PercentBar
                  key={os.name}
                  entry={os}
                  gradient="bg-gradient-to-r from-purple-500 to-pink-600"
                />
              ))}
            </>
          ) : (
            <EmptyRow>No category or OS data available</EmptyRow>
          )}
        </GradientPanel>
      </div>
    </div>
  );
}

function GitHub({ stats, about }: { stats: GitHubStats; about: AboutData }) {
  const streakRange =
    stats.current_streak_start && stats.current_streak_end
      ? `${shortDate(stats.current_streak_start)} - ${shortDate(stats.current_streak_end)}`
      : "No active streak";

  return (
    <div className="mb-6">
      <div className="flex flex-row items-center justify-between mb-3 md:mb-4 gap-2">
        <h2 className="text-xl font-medium">GitHub Statistics</h2>
        <p className="font-mono text-xs sm:text-sm text-zinc-400 hover:text-zinc-300 transition-all duration-300 truncate">
          <a href={about.social_media.github} className="font-medium" target="_blank" rel="noopener noreferrer">
            @{about.username}
          </a>
        </p>
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

      <ContributionHeatmap weeks={stats.weeks} months={stats.months} />
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
        <ul className="flex flex-col gap-3 px-1 py-1">{children}</ul>
      </div>
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <li className="text-center text-zinc-400 text-sm py-4">{children}</li>;
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

function PanelSkeleton({ columns }: { columns: 2 | 4 }) {
  // Written out rather than interpolated: Tailwind generates a class only if it
  // can see it in the source, so `lg:grid-cols-${columns}` would produce no rule.
  const grid =
    columns === 2
      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4";

  return (
    <div className="mb-6" aria-hidden="true">
      <div className="h-8 w-56 mb-4 rounded bg-zinc-900/60 animate-pulse" />
      <div className={grid}>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-20 rounded-xl bg-zinc-900/40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/** "Aug 20, 2026", matching Django's `%b %d, %Y`. */
function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(`${iso}T00:00:00Z`));
}
