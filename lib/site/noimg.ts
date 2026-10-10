/**
 * What a card draws when a project or post has no picture.
 *
 * A plain module, because both a server page and a client list read it, and a
 * constant exported from a `"use client"` file is not that constant.
 *
 * The drawing is chosen by the project's category *slug* -- an identifier, where
 * the label is editorial and may be reworded from the admin -- and varied by a
 * seed taken from the title, so two projects of one kind are the same sort of
 * sketch with different proportions rather than one tile repeated down a page.
 */

export const MOTIFS = ["browser", "terminal", "chart", "network", "flow", "tiles", "page"] as const;
export type Motif = (typeof MOTIFS)[number];

/** Category slug to drawing. Anything not listed is drawn as a web page. */
const BY_KIND: Record<string, Motif> = {
  "web-app": "browser",
  "web-development": "browser",
  "landing-page": "browser",
  portfolio: "browser",
  "e-commerce": "browser",
  "social-media": "browser",
  "saas-platform": "browser",
  api: "terminal",
  "websocket-sync": "terminal",
  bot: "flow",
  automation: "flow",
  "web-scraping": "flow",
  dashboard: "chart",
  finance: "chart",
  fintech: "chart",
  optimization: "chart",
  "machine-learning": "network",
  ai: "network",
  "computer-vision": "network",
  gaming: "tiles",
  education: "page",
};

export function motifFor(kind?: string | null): Motif {
  return (kind && BY_KIND[kind]) || "browser";
}

/** FNV-1a: the same text always gives the same number, on the server and in the browser. */
export function seedOf(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** mulberry32. Not `Math.random`: a drawing that differs between the two renders is a hydration mismatch. */
export function rand(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
