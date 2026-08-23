/**
 * Deterministic shuffle.
 *
 * The homepage renders the skill marquee as three rows drawn from the same
 * catalogue, shuffled so the rows do not read as one repeated list.
 *
 * A different arrangement on every request is not available here, and losing it
 * costs nothing.
 * `Math.random()` inside a prerendered tree is rejected outright under Cache
 * Components -- it is exactly the kind of non-deterministic value that makes a
 * static shell meaningless -- so keeping it would force the homepage to render
 * dynamically on every visit. And a visitor sees one arrangement per page load
 * either way; the variety that matters is *between the three rows*, not between
 * two visits.
 *
 * So the rows use three fixed seeds. The visual result is identical: three
 * differently-ordered rows. Change a seed to reshuffle.
 */

/** mulberry32 -- small, fast, and good enough for shuffling a display list. */
function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, driven by a seeded generator. Does not mutate the input. */
export function shuffle<T>(items: readonly T[], seed: number): T[] {
  const random = seededRandom(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** The three seeds the marquee rows use. Arbitrary, but fixed. */
export const MARQUEE_SEEDS = [0x5eed_1, 0x5eed_2, 0x5eed_3] as const;
