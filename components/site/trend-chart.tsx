"use client";

import { useState } from "react";

import { useReveal } from "@/components/site/use-reveal";
import type { TrendWeek } from "@/lib/data/wakatime-rhythm";

/**
 * How the AI share of written lines has moved across the year.
 *
 * The one figure on this page that is a direction rather than a quantity. Both
 * AI panels already report where it stands; a year of weekly points is the only
 * thing that says whether it got there gradually or in a fortnight.
 *
 * **Weekly points, not daily.** A day of eight hand-typed lines and a day of
 * three thousand AI ones are the same dot on a daily chart, so the line spends
 * most of the year snapping between 0 and 100 and the shape is noise. Each
 * point is computed from its own week's line totals -- see `weeklyAiTrend`.
 */

/** The drawing box. Points are mapped into it; the SVG then stretches to fit. */
const WIDTH = 100;
const HEIGHT = 40;
/** Room at the top and bottom so a week at 0% or 100% is still a visible line. */
const PAD = 2;

function project(point: TrendWeek): [number, number] {
  const clamped = Math.min(100, Math.max(0, point.y));
  return [point.x * WIDTH, HEIGHT - PAD - (clamped / 100) * (HEIGHT - PAD * 2)];
}

export function TrendChart({ points, label }: { points: TrendWeek[]; label: string }) {
  const [detail, setDetail] = useState<string | null>(null);

  // One trigger on the figure: the line draws itself in a single stroke, and an
  // observer per hover column would have nothing to release.
  const chartRef = useReveal<HTMLDivElement>(undefined, 0.15);

  const line = points
    .map(project)
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");
  const area = `${line} L${WIDTH} ${HEIGHT} L0 ${HEIGHT} Z`;

  return (
    <div ref={chartRef} onMouseLeave={() => setDetail(null)}>
      <div className="flex gap-2">
        {/*
          The scale, in a gutter of its own and the same width as the weekday
          chart's. Overlaid on the plot instead, these labels sat on top of the
          first weeks of the year -- and the two charts stack one above the
          other, so a shared gutter is also what lines their plots up.
        */}
        <div className="relative h-32 w-14 shrink-0 sm:h-40 sm:w-16">
          <span className="absolute right-0 top-0 -translate-y-1/2 text-xs text-zinc-400">100%</span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-zinc-400">50%</span>
          <span className="absolute right-0 top-full -translate-y-1/2 text-xs text-zinc-400">0%</span>
        </div>

        <div className="relative flex-1 text-violet-400">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            /*
              Stretched rather than scaled uniformly, so the year always spans
              the panel whatever it is wide. That distorts anything drawn in
              user units, which is why the stroke is exempted below and why
              there are no dots on this chart -- a circle here would render as
              an ellipse that changed shape with the viewport.
            */
            preserveAspectRatio="none"
            className="h-32 w-full sm:h-40"
            role="img"
            aria-label={label}
          >
            <defs>
              {/*
                The fill follows `currentColor`, so the one text colour on the
                wrapper carries both halves of the chart -- and so the light
                palette's remap reaches the gradient, which a hard-coded stop
                could not.
              */}
              <linearGradient id="ai-trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Rules at nothing, half and all, matching the labels beside them. */}
            {[0, 0.5, 1].map((step) => (
              <line
                key={step}
                x1="0"
                x2={WIDTH}
                y1={HEIGHT - PAD - step * (HEIGHT - PAD * 2)}
                y2={HEIGHT - PAD - step * (HEIGHT - PAD * 2)}
                className="stroke-zinc-800"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path d={area} fill="url(#ai-trend-fill)" className="trend-area" />
            <path
              d={line}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              /*
                `pathLength` normalises the line to one unit long whatever its
                real geometry, which is what lets the draw-on keyframe be
                written as a dash offset of 1 rather than a number measured
                after the fact -- the path is a different length at every
                viewport width.
              */
              pathLength={1}
              vectorEffect="non-scaling-stroke"
              className="trend-line"
            />
          </svg>

          {/*
            The hover targets, one per week, over the whole plot rather than on
            the line: a two-pixel stroke is not something a pointer can find.
          */}
          <div className="absolute inset-0 flex">
            {points.map((point) => (
              <span
                key={point.x}
                className="h-full flex-1 cursor-help"
                title={point.detail}
                onMouseEnter={() => setDetail(point.detail)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Reserved height, so nothing below shifts as the pointer crosses. */}
      <div
        className={`mt-1 ml-16 h-6 sm:ml-18 text-xs text-zinc-400 transition-opacity duration-200 sm:text-sm ${
          detail ? "opacity-100" : "opacity-0"
        }`}
        aria-live="polite"
      >
        {detail ?? "Hover a week to see its share"}
      </div>
    </div>
  );
}
