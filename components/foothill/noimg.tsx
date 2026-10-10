import { motifFor, rand, seedOf, type Motif } from "@/lib/site/noimg";

/**
 * The tile a project or post draws when it has no picture: a line sketch of
 * the kind of thing it is (a web page, a terminal, a chart, a network, a flow,
 * a board, an article) over a dotted ground, with its title under it.
 *
 * Drawn in the page's own greys and nothing else, and meant to read as a
 * deliberate empty state rather than a missing file. Every class is `ni-`
 * prefixed: this sheet's names sit beside Tailwind's, and a bare one (`ring`)
 * once picked up a utility's box-shadow.
 *
 * Pure and seeded from the title, so the server and the browser draw the same
 * proportions. The title is hidden by a container query below 200px, where the
 * tile is a thumbnail in a list and the sketch is all there is room for.
 */

type Rand = () => number;

/** One decimal: a long float in every attribute is bytes in every card. */
const n = (value: number) => Math.round(value * 10) / 10;

function Frame() {
  return (
    <>
      <rect className="ni-w" x="12" y="4" width="176" height="112" rx="5" />
      <path className="ni-l" d="M12 20H188" />
      <circle className="ni-b" cx="21" cy="12" r="2" />
      <circle className="ni-b" cx="28" cy="12" r="2" />
      <circle className="ni-b" cx="35" cy="12" r="2" />
    </>
  );
}

/** The universal picture glyph: a frame, a hill and a sun. It says "image goes here". */
function Picture({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const at = (fx: number, fy: number) => `${n(x + w * fx)} ${n(y + h * fy)}`;
  return (
    <>
      <rect className="ni-l" x={x} y={y} width={w} height={h} rx="3" />
      <path className="ni-o" d={`M${at(0.08, 0.86)}L${at(0.34, 0.5)}L${at(0.52, 0.72)}L${at(0.7, 0.42)}L${at(0.92, 0.86)}`} />
      <circle className="ni-o" cx={n(x + w * 0.74)} cy={n(y + h * 0.26)} r={n(Math.min(w, h) * 0.08)} />
    </>
  );
}

function browser(r: Rand) {
  // The picture sits on the left or the right, the heading runs one to two
  // lines at its own length, and the row under it holds two or three cards, so
  // two web projects are the same sort of page and not the same page.
  const flip = r() > 0.5;
  const textX = flip ? 108 : 20;
  const picX = flip ? 20 : 108;
  const reach = flip ? 72 : 84;
  const heading = [n(Math.min(reach, 40 + r() * 46)), n(Math.min(reach, 24 + r() * 46))];
  const lines = [n(Math.min(reach, 44 + r() * 40)), n(Math.min(reach, 28 + r() * 40))];
  const cards = 2 + Math.floor(r() * 2);
  const cardW = (156 - 8 * (cards - 1)) / cards;
  return (
    <>
      <Frame />
      <rect className="ni-k" x="20" y="26" width="12" height="5" rx="1.5" />
      {[118, 138, 158].slice(0, 2 + Math.floor(r() * 2)).map((x) => (
        <rect key={x} className="ni-b" x={x} y="27.5" width="14" height="2" rx="1" />
      ))}
      <rect className="ni-k" x={textX} y="42" width={heading[0]} height="6" rx="1.5" />
      <rect className="ni-k" x={textX} y="52" width={heading[1]} height="6" rx="1.5" />
      <rect className="ni-b" x={textX} y="65" width={lines[0]} height="3" rx="1.5" />
      <rect className="ni-b" x={textX} y="71" width={lines[1]} height="3" rx="1.5" />
      <rect className="ni-o" x={textX} y="81" width={n(22 + r() * 14)} height="9" rx="3" />
      <Picture x={picX} y={38} w={72} h={54} />
      {Array.from({ length: cards }, (_, i) => (
        <rect key={i} className="ni-l" x={n(20 + i * (cardW + 8))} y="98" width={n(cardW)} height="11" rx="2" />
      ))}
    </>
  );
}

function terminal(r: Rand) {
  // Three to five requests, each with its own verb, path and result, then the prompt.
  const rows = 3 + Math.floor(r() * 3);
  return (
    <>
      <Frame />
      {Array.from({ length: rows }, (_, i) => {
        const y = 32 + i * 14;
        const verb = n(12 + r() * 12);
        const result = n(16 + r() * 14);
        return (
          <g key={y}>
            <path className="ni-o" d={`M20 ${y - 3}l4 3-4 3`} />
            <rect className="ni-k" x="30" y={y - 3.5} width={verb} height="7" rx="1.5" />
            <rect className="ni-b" x={n(34 + verb)} y={y - 1.5} width={n(30 + r() * 62)} height="3" rx="1.5" />
            {r() > 0.25 && <rect className="ni-o" x={n(180 - result)} y={y - 3.5} width={result} height="7" rx="3.5" />}
          </g>
        );
      })}
      <path className="ni-o" d={`M20 ${32 + rows * 14 - 3}l4 3-4 3`} />
      <rect className="ni-k" x="30" y={32 + rows * 14 - 5} width="6" height="10" rx="1" />
    </>
  );
}

function chart(r: Rand) {
  const candles: { x: number; open: number; close: number; hi: number; lo: number }[] = [];
  let level = 70;
  for (let i = 0; i < 9; i++) {
    const open = level;
    const close = Math.min(98, Math.max(38, open + (r() - 0.5) * 24));
    candles.push({
      x: 38 + i * 16,
      open,
      close,
      hi: Math.min(open, close) - (2 + r() * 7),
      lo: Math.max(open, close) + (2 + r() * 7),
    });
    level = close;
  }
  const trend = candles.map((c, i) => `${i ? "L" : "M"}${n(c.x)} ${n((c.open + c.close) / 2)}`).join("");
  return (
    <>
      <Frame />
      <path className="ni-l" d="M26 28V106H182" />
      <path className="ni-l ni-d" d="M26 48H182M26 68H182M26 88H182" />
      {candles.map((c) => (
        <g key={c.x}>
          <path className="ni-o" d={`M${n(c.x)} ${n(c.hi)}V${n(c.lo)}`} />
          <rect
            className={c.close < c.open ? "ni-up" : "ni-k"}
            x={c.x - 4}
            y={n(Math.min(c.open, c.close))}
            width="8"
            height={n(Math.max(3, Math.abs(c.open - c.close)))}
            rx="1"
          />
        </g>
      ))}
      <path className="ni-o" d={trend} />
    </>
  );
}

function network(r: Rand) {
  const counts = [2 + Math.floor(r() * 2), 3 + Math.floor(r() * 2), 2 + Math.floor(r() * 2)];
  const xs = [38, 100, 162];
  const layers = counts.map((count, layer) =>
    Array.from({ length: count }, (_, j) => ({ x: xs[layer], y: n(60 + (j - (count - 1) / 2) * 24), on: r() < 0.4 })),
  );
  const edges: string[] = [];
  for (let l = 0; l < layers.length - 1; l++)
    for (const from of layers[l]) for (const to of layers[l + 1]) edges.push(`M${from.x} ${from.y}L${to.x} ${to.y}`);
  return (
    <>
      <rect className="ni-l ni-d" x="8" y="8" width="184" height="104" rx="6" />
      <path className="ni-l" d={edges.join("")} />
      {layers.flat().map((node) => (
        <circle key={`${node.x}-${node.y}`} className={node.on ? "ni-k" : "ni-w"} cx={node.x} cy={node.y} r="6" />
      ))}
    </>
  );
}

function flow(r: Rand) {
  const above = r() > 0.5;
  return (
    <>
      <rect className="ni-l ni-d" x="8" y="6" width="184" height="108" rx="6" />
      {[18, 138].map((x) => (
        <g key={x}>
          <rect className="ni-w" x={x} y="44" width="44" height="32" rx="5" />
          <rect className="ni-k" x={x + 8} y="54" width="20" height="4" rx="2" />
          <rect className="ni-b" x={x + 8} y="63" width="28" height="3" rx="1.5" />
        </g>
      ))}
      <path className="ni-w" d="M100 40L124 60L100 80L76 60Z" />
      <circle className="ni-k" cx="100" cy="60" r="3" />
      <path className="ni-o" d="M62 60H76M73 57l3 3-3 3M124 60H138M135 57l3 3-3 3M100 80V94M97 91l3 3 3-3" />
      <rect className="ni-w" x="78" y="94" width="44" height="14" rx="4" />
      <rect className="ni-b" x="86" y="99.5" width="28" height="3" rx="1.5" />
      {above && (
        <>
          <path className="ni-o" d="M100 40V28M97 31l3-3 3 3" />
          <rect className="ni-w" x="84" y="13" width="32" height="15" rx="4" />
          <rect className="ni-b" x="91" y="19" width="18" height="3" rx="1.5" />
        </>
      )}
    </>
  );
}

function tiles(r: Rand) {
  const filled = new Set<number>();
  while (filled.size < 4) filled.add(Math.floor(r() * 12));
  let cursor = Math.floor(r() * 12);
  while (filled.has(cursor)) cursor = (cursor + 1) % 12;
  return (
    <>
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          className={filled.has(i) ? "ni-k" : i === cursor ? "ni-up" : "ni-l"}
          x={28 + (i % 4) * 38}
          y={7 + Math.floor(i / 4) * 38}
          width="30"
          height="30"
          rx="6"
        />
      ))}
    </>
  );
}

function page(r: Rand) {
  return (
    <>
      <Frame />
      <rect className="ni-k" x="22" y="30" width={n(80 + r() * 44)} height="7" rx="1.5" />
      <rect className="ni-b" x="22" y="42" width="44" height="3" rx="1.5" />
      <Picture x={22} y={52} w={156} h={26} />
      <rect className="ni-b" x="22" y="86" width="156" height="3" rx="1.5" />
      <rect className="ni-b" x="22" y="94" width="156" height="3" rx="1.5" />
      <rect className="ni-b" x="22" y="102" width={n(70 + r() * 60)} height="3" rx="1.5" />
    </>
  );
}

const DRAW: Record<Motif, (r: Rand) => React.ReactNode> = { browser, terminal, chart, network, flow, tiles, page };

export function NoImage({ title, kind, motif }: { title: string; kind?: string | null; motif?: Motif }) {
  const art = DRAW[motif ?? motifFor(kind)](rand(seedOf(title)));
  return (
    <span className="noimg" role="img" aria-label={`${title}, no preview yet`}>
      <svg className="ni-art" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
        {art}
      </svg>
      <span className="ni-cap" aria-hidden="true">
        {title}
      </span>
    </span>
  );
}
