/**
 * The two volcanoes Boyolali sits between, as contour lines.
 *
 * A heightfield with two summits -- Merbabu to the north-west, Merapi to the
 * south-east, at their real heights -- traced into closed loops, one per
 * elevation. Generated rather than drawn by hand so the lines are honest
 * contours of one surface: they never cross, they nest, and below the saddle
 * between the peaks a single loop wraps both, which is what the land does.
 *
 * Deterministic and pure: the same paths on the server and in every browser,
 * computed once per render of the hero and never shipped as data.
 */

export type Contour = {
  /** SVG path data, closed. */
  d: string;
  /** The elevation this line traces, in metres. */
  metres: number;
};

export type Summit = { name: string; metres: number; x: number; y: number };

export const VIEW = { width: 1200, height: 600 };

export const SUMMITS: Summit[] = [
  { name: "Merbabu", metres: 3145, x: 420, y: 250 },
  { name: "Merapi", metres: 2930, x: 800, y: 370 },
];

/** Metres between two neighbouring lines. */
const INTERVAL = 160;
/** The lowest line drawn: the foothills Boyolali stands on, roughly. */
const FLOOR = 340;

const SPREAD = [205, 165];

/**
 * Height at a point. Merbabu is an old, broad massif; Merapi is a young cone,
 * so its falloff is steeper. The sine terms are the ridges and gullies that
 * keep a contour from reading as a compass circle.
 */
function height(x: number, y: number): number {
  let h = 0;
  SUMMITS.forEach((summit, i) => {
    const dx = (x - summit.x) / SPREAD[i];
    const dy = (y - summit.y) / (SPREAD[i] * 0.82);
    const d = Math.sqrt(dx * dx + dy * dy);
    h += summit.metres * Math.exp(-Math.pow(d, i === 0 ? 1.15 : 1));
  });
  const ripple =
    Math.sin(x * 0.017 + y * 0.011) * 0.06 +
    Math.sin(x * 0.006 - y * 0.015 + 1.3) * 0.08 +
    Math.sin(x * 0.031 - y * 0.027 + 0.4) * 0.025 +
    Math.sin(Math.atan2(y - 310, x - 615) * 9) * 0.03;
  return h * (1 + ripple);
}

/**
 * How far out from a centre along `angle` the surface stands at `level`.
 *
 * Two ways of asking, because the two kinds of loop need different edges.
 * A loop around both summits wants the *outermost* crossing, so it walks in
 * from far away -- the ray from the midpoint climbs one flank before it
 * descends the other. A loop around one summit wants the *first* crossing
 * going out, or a ray aimed at the other summit would climb it and fold that
 * peak into this one's loop.
 */
function reach(cx: number, cy: number, angle: number, level: number, from: "outside" | "centre"): number {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const at = (r: number) => height(cx + cos * r, cy + sin * r);
  const step = 6;

  let inner: number;
  let outer: number;
  if (from === "outside") {
    inner = 1400;
    while (inner > 0 && at(inner) < level) inner -= step;
    if (inner <= 0) return 0;
    outer = inner + step;
  } else {
    if (at(0) < level) return 0;
    outer = step;
    while (outer < 1400 && at(outer) >= level) outer += step;
    inner = outer - step;
  }
  for (let i = 0; i < 18; i++) {
    const mid = (inner + outer) / 2;
    if (at(mid) >= level) inner = mid;
    else outer = mid;
  }
  return inner;
}

/** A closed loop through `points` as a smooth Catmull-Rom curve. */
function smoothLoop(points: [number, number][]): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  const f = (v: number) => v.toFixed(1);
  let d = `M${f(p(0)[0])} ${f(p(0)[1])}`;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = p(i - 1);
    const [x1, y1] = p(i);
    const [x2, y2] = p(i + 1);
    const [x3, y3] = p(i + 2);
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += `C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x2)} ${f(y2)}`;
  }
  return `${d}Z`;
}

function loop(
  cx: number,
  cy: number,
  level: number,
  from: "outside" | "centre",
  samples = 120,
): string | null {
  const points: [number, number][] = [];
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2;
    const r = reach(cx, cy, angle, level, from);
    if (r <= 0) return null;
    points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
  }
  return smoothLoop(points);
}

/** The lowest point on the straight line between the summits. */
function saddle(): number {
  const [a, b] = SUMMITS;
  let low = Infinity;
  for (let t = 0; t <= 1; t += 0.01) low = Math.min(low, height(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t));
  return low;
}

/**
 * Every contour, lowest first.
 *
 * Below the saddle one loop encloses both summits and is traced from the
 * midpoint between them; above it each summit carries its own loops until its
 * height runs out.
 */
export function contours(): Contour[] {
  const pass = saddle();
  const [a, b] = SUMMITS;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const top = Math.max(...SUMMITS.map((s) => s.metres));
  const lines: Contour[] = [];

  for (let metres = FLOOR; metres < top; metres += INTERVAL) {
    if (metres < pass) {
      const d = loop(mid.x, mid.y, metres, "outside");
      if (d) lines.push({ d, metres });
      continue;
    }
    for (const summit of SUMMITS) {
      if (metres >= summit.metres - 60) continue;
      const d = loop(summit.x, summit.y, metres, "centre", 72);
      if (d) lines.push({ d, metres });
    }
  }
  return lines;
}
