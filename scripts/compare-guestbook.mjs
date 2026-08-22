/**
 * Compare the rendered guestbook thread against the live Django site.
 *
 * The threading rules are the risky part of this port: which message becomes a
 * root, which reply is flattened off its parent at the depth cap, and which
 * ones therefore need the caption naming who they answered. `apps/guestbook/
 * tree.py` and `lib/data/guestbook-tree.ts` are two implementations of the same
 * algorithm, and a unit test would only prove the port agrees with itself.
 *
 * This walks both rendered pages and compares the tree they actually produce:
 * every message's id, depth, parent, pinned state and caption. Both are signed
 * out, so the two see the same window of messages.
 *
 *   node scripts/compare-guestbook.mjs [nextBase] [liveBase]
 */
import { chromium } from "playwright";

const NEXT = process.argv[2] ?? "http://localhost:3000";
const LIVE = process.argv[3] ?? "https://ridwaanhall.com";

/**
 * Read the thread as a flat list of {id, depth, parent, pinned, caption}.
 *
 * Both trees carry `.gb-message[data-message-id][data-depth]` and nest replies
 * under `.gb-replies`, so one extractor serves both. The caption is normalised
 * to collapse whitespace -- Django's template indentation differs from JSX's.
 */
async function readThread(browser, base) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1200 } });
  await page.goto(`${base}/guestbook/`, { waitUntil: "load", timeout: 60000 });
  await page.waitForSelector(".gb-message", { timeout: 30000 });
  await page.waitForTimeout(800);

  const rows = await page.evaluate(() => {
    const out = [];
    const walk = (node, parentId) => {
      const id = Number(node.dataset.messageId);
      const caption = node.querySelector(":scope > .group\\/msg .text-zinc-500.truncate, :scope > .group\\/msg span.truncate");
      out.push({
        id,
        depth: Number(node.dataset.depth),
        parent: parentId,
        // Visibility, not presence. Django renders the badge on *every*
        // message and hides it with `hidden` when unpinned, so its script could
        // unhide it after an AJAX pin; the port renders it only when pinned,
        // because revalidation re-renders the message. Same thing on screen, so
        // the comparison has to ask what is shown rather than what exists.
        pinned: (() => {
          const badge = node.querySelector(':scope > .group\\/msg [title="Pinned message"]');
          return !!badge && badge.offsetParent !== null;
        })(),
        caption: caption ? caption.textContent.replace(/\s+/g, " ").trim() : null,
        text: (node.querySelector(":scope > .group\\/msg p") || {}).textContent?.replace(/\s+/g, " ").trim() ?? "",
      });
      const replies = node.querySelector(":scope > .gb-replies");
      if (replies) {
        for (const child of replies.querySelectorAll(":scope > .gb-branch > .gb-message")) {
          walk(child, id);
        }
      }
    };
    const container = document.querySelector("#guestbook-messages");
    for (const root of container.querySelectorAll(":scope > div > .gb-message, :scope > .gb-message")) {
      walk(root, null);
    }
    return out;
  });

  await page.close();
  return rows;
}

const browser = await chromium.launch();
const [live, next] = await Promise.all([readThread(browser, LIVE), readThread(browser, NEXT)]);
await browser.close();

let failures = 0;
const fail = (message) => {
  console.log(`  FAIL  ${message}`);
  failures += 1;
};

console.log(`live: ${live.length} messages, next: ${next.length} messages`);
if (live.length !== next.length) fail(`message count differs: ${live.length} vs ${next.length}`);

const byId = new Map(next.map((row) => [row.id, row]));

for (const expected of live) {
  const actual = byId.get(expected.id);
  if (!actual) {
    fail(`#${expected.id} is missing from the port`);
    continue;
  }
  if (actual.depth !== expected.depth) {
    fail(`#${expected.id} depth ${expected.depth} -> ${actual.depth}`);
  }
  if (actual.parent !== expected.parent) {
    fail(`#${expected.id} parent ${expected.parent} -> ${actual.parent}`);
  }
  if (actual.pinned !== expected.pinned) {
    fail(`#${expected.id} pinned ${expected.pinned} -> ${actual.pinned}`);
  }
  // A caption is present or absent in both, which is the `show_reply_to` rule.
  if ((actual.caption === null) !== (expected.caption === null)) {
    fail(`#${expected.id} caption ${expected.caption === null ? "absent" : "present"} -> ${actual.caption === null ? "absent" : "present"}`);
  } else if (actual.caption !== null && actual.caption !== expected.caption) {
    fail(`#${expected.id} caption text\n          live: ${expected.caption}\n          next: ${actual.caption}`);
  }
  if (actual.text !== expected.text) {
    fail(`#${expected.id} body differs\n          live: ${expected.text.slice(0, 60)}\n          next: ${actual.text.slice(0, 60)}`);
  }
}

const roots = (rows) => rows.filter((r) => r.parent === null).length;
const maxDepth = (rows) => Math.max(...rows.map((r) => r.depth));
console.log(`  roots      live ${roots(live)}  next ${roots(next)}`);
console.log(`  max depth  live ${maxDepth(live)}  next ${maxDepth(next)}`);
console.log(`  captions   live ${live.filter((r) => r.caption).length}  next ${next.filter((r) => r.caption).length}`);

console.log(
  failures === 0
    ? `\nThe thread matches the live site: ${live.length} messages, same shape, same captions.`
    : `\n${failures} difference(s).`,
);
process.exit(failures === 0 ? 0 : 1);
