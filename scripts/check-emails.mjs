/**
 * Render all five email pairs and check what the originals could not.
 *
 * CLAUDE.md recorded these as a gotcha with "no automated test
 * covers these": it filled `{{ key }}` tokens with `str.replace`, so a
 * placeholder the calling method forgot was left sitting in the *sent* email,
 * and a `{% %}` tag silently did nothing. This is that test.
 *
 * It renders every template with realistic values — including a name and a
 * message carrying HTML — and asserts:
 *
 *   - no `{{ … }}` survives in any of the ten bodies
 *   - a missing value throws rather than shipping the raw token
 *   - user text is escaped in HTML bodies and raw in text bodies
 *   - the guestbook URL is *not* escaped, or the href would break
 *   - the empty-name fallbacks land ("there", and the address as a name)
 *   - light renders completely on its own, with dark only ever an overlay
 *   - the confirmations report the sender back, and the reply notification
 *     reports no address at all
 *
 * Nothing is sent. No network, no credentials.
 *
 *   npx tsx scripts/check-emails.mjs [--write out/]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const render = await import("../lib/email/render.ts");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/** A name and a message that would break a template that forgot to escape. */
const HOSTILE_NAME = `Ada <script>alert(1)</script> & "Lovelace"`;
const HOSTILE_MESSAGE = `line one\nline two & <b>bold</b>\n<img src=x onerror=alert(1)>`;
const URL = "https://ridwaanhall.com/guestbook/";

const contact = { name: HOSTILE_NAME, senderEmail: "ada@example.com", message: HOSTILE_MESSAGE };
const guestbook = { ...contact, timestamp: "August 21, 2026 at 18:09:00 WIB", guestbookUrl: URL };
const reply = {
  originalName: "Grace Hopper",
  replyName: HOSTILE_NAME,
  replyMessage: HOSTILE_MESSAGE,
  originalMessage: "the original & <i>message</i>",
  timestamp: guestbook.timestamp,
  guestbookUrl: URL,
};

const rendered = {
  contactNotification: render.contactNotification(contact),
  contactAutoreply: render.contactAutoreply(contact),
  guestbookNotification: render.guestbookNotification(guestbook),
  guestbookAutoreply: render.guestbookAutoreply(guestbook),
  guestbookReplyNotification: render.guestbookReplyNotification(reply),
};

// --- every placeholder is filled -------------------------------------------
const LEFTOVER = /\{\{\s*[\w.]+\s*\}\}/g;
for (const [name, body] of Object.entries(rendered)) {
  for (const part of ["html", "text"]) {
    const found = body[part].match(LEFTOVER);
    check(`${name}.${part} has no unfilled placeholder`, found === null, found ? found.join(", ") : "");
  }
}

// --- a missing value is loud ------------------------------------------------
// Reaching past the typed API on purpose: the guarantee under test is that the
// renderer refuses, not that TypeScript would have caught it at the call site.
let threw = false;
try {
  render.guestbookNotification({ ...guestbook, timestamp: undefined });
} catch {
  threw = true;
}
check("a missing value throws instead of shipping the token", threw);

// --- escaping ----------------------------------------------------------------
const notification = rendered.contactNotification;
check(
  "the name is escaped in the HTML body",
  !notification.html.includes("<script>") && notification.html.includes("&lt;script&gt;"),
);
check(
  "quotes in the name are escaped too",
  notification.html.includes("&quot;Lovelace&quot;"),
);
check(
  "the message is escaped in the HTML body",
  !notification.html.includes("onerror=alert(1)>") && notification.html.includes("&lt;img src=x"),
);
check("newlines become <br> in the HTML body", notification.html.includes("line one<br>line two"));
check(
  "the text body is left raw",
  notification.text.includes("<script>") && notification.text.includes("line one\nline two"),
);

// --- the URL must survive intact --------------------------------------------
for (const name of ["guestbookNotification", "guestbookAutoreply", "guestbookReplyNotification"]) {
  check(`${name} keeps the guestbook URL usable`, rendered[name].html.includes(`href="${URL}"`));
}

// --- the redesign: light inline, dark as an overlay --------------------------
// The emails follow both of the site's palettes now. Light is written inline on
// every element; dark is one stylesheet block that only a dark-mode client
// applies.
//
// That ordering is the guarantee under test. A client which drops the
// stylesheet -- Gmail clipping a long message, Outlook, a text-only proxy --
// must still receive a complete, correct light email, so nothing dark may be
// painted outside the block and nothing structural may live inside it. Check
// both directions and the arrangement cannot quietly invert into a dark email
// carrying a light patch on top.
const STYLE = /<style>([\s\S]*?)<\/style>/;

/** The document with its dark overlay removed: what a stripping client sees. */
const stripped = (html) => html.replace(STYLE, "");

// The action button is the one deliberately dark surface in the light
// rendering -- near-black, so the single call to action carries contrast rather
// than colour. It is excluded by its class, not by its hex, so a dark *card*
// painted the same colour still fails.
const BUTTON = /<table[^>]*>\s*<tr><td class="e-action"[\s\S]*?<\/table>/;

const DARK_SURFACES = ["#000000", "#09090b", "#18181b", "#1f1f23", "#27272a"];
for (const [name, body] of Object.entries(rendered)) {
  const light = stripped(body.html).replace(BUTTON, "");
  const found = DARK_SURFACES.filter(
    (hex) => light.includes(`background:${hex}`) || light.includes(`bgcolor="${hex}"`),
  );
  check(`${name} paints no dark surface outside the overlay`, found.length === 0, found.join(" "));
}

// The light rendering has to be complete on its own, so these are asserted
// against the stripped document rather than the whole one.
for (const [name, body] of Object.entries(rendered)) {
  const light = stripped(body.html);
  check(`${name} offers both schemes`, body.html.includes('content="light dark"'));
  check(`${name} sits on the white canvas without the overlay`, light.includes("background:#ffffff"));
  check(`${name} uses the light card surface without the overlay`, light.includes("background:#f7f7f7"));
}

// And the overlay itself: one block, in the head, colour only. A layout
// property in here would be exactly what the stripping client loses.
const OVERLAY_PROPERTIES = new Set(["background", "border-color", "color"]);
for (const [name, body] of Object.entries(rendered)) {
  const match = body.html.match(STYLE);
  check(
    `${name} carries exactly one overlay`,
    match !== null && body.html.split("<style").length === 2,
  );
  if (!match) continue;

  check(
    `${name} keeps the overlay in the head`,
    body.html.indexOf("<style") < body.html.indexOf("</head>"),
  );
  check(`${name} actually repaints for dark`, match[1].includes("#09090b"));

  // The media preamble is dropped first: `prefers-color-scheme:dark` reads as a
  // declaration to anything scanning for `property:`.
  const declarations = match[1].replace(/@media[^{]*\{/g, "");
  const properties = [...new Set([...declarations.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]))];
  const structural = properties.filter((property) => !OVERLAY_PROPERTIES.has(property));
  check(`${name} overlay changes colour only`, structural.length === 0, structural.join(" "));
}

// Every one is built from the same shell, so the chrome must be identical --
// from the body tag down to where the per-email content starts. The preheader
// is cut out first: it is the one thing in that span which is *supposed* to
// differ, being the line the inbox shows beside the subject.
const CONTENT_START = '<tr><td style="padding:28px 26px 8px;">';
const PREHEADER = /<div style="display:none;[\s\S]*?<\/div>/;
const chrome = Object.values(rendered).map((b) => {
  const html = b.html.replace(PREHEADER, "");
  return html.slice(html.indexOf("<body"), html.indexOf(CONTENT_START));
});
check("all five share one chrome", new Set(chrome).size === 1, `${new Set(chrome).size} variants`);
for (const [name, body] of Object.entries(rendered)) {
  check(`${name} has the brand header`, body.html.includes("ridwaanhall.com</span>"));
  check(
    `${name} has the footer`,
    body.html.includes('Sent by <a class="e-link" href="https://ridwaanhall.com"'),
  );
  check(`${name} has a preheader`, /max-height:0;max-width:0;opacity:0/.test(body.html));
}

// Layout has to survive Outlook, which means tables and inline styles only.
for (const [name, body] of Object.entries(rendered)) {
  check(`${name} uses no external stylesheet`, !/<link/.test(body.html));
  check(`${name} uses no flex or grid`, !/display:\s*(flex|grid)/.test(body.html));
}

// --- what the routing rework promised the reader -----------------------------
// Both confirmations report the sender back to themselves -- name, address and
// message -- which is the whole point of a receipt.
for (const name of ["contactAutoreply", "guestbookAutoreply"]) {
  check(
    `${name} reports the sender's name back`,
    rendered[name].html.includes("&quot;Lovelace&quot;"),
  );
  check(
    `${name} reports the sender's address back`,
    rendered[name].html.includes("ada@example.com"),
  );
}

// The reply notification must not. Its Reply-To is the owner precisely so the
// two readers never learn each other's addresses, and an address in the body
// would hand over what the header withholds.
const ADDRESS = /[\w.+-]+@[\w-]+\.[\w.]+/;
for (const part of ["html", "text"]) {
  const body = rendered.guestbookReplyNotification[part];
  const found = body.match(ADDRESS);
  check(`the reply notification renders no address (${part})`, found === null, found ? found[0] : "");
}
check(
  "the reply notification offers no mailto either",
  !rendered.guestbookReplyNotification.html.includes("mailto:"),
);

// --- the empty-name fallbacks -----------------------------------------------
const anonymous = render.contactAutoreply({ ...contact, name: "" });
check('an empty name greets "there"', anonymous.text.includes("there"));
check(
  "and shows the address where a name would go",
  anonymous.text.includes("ada@example.com") && anonymous.html.includes("ada@example.com"),
);

const anonymousReply = render.guestbookReplyNotification({ ...reply, originalName: "" });
check('the reply notification greets "there" too', anonymousReply.text.includes("there"));

// --- both parts are non-trivial ---------------------------------------------
for (const [name, body] of Object.entries(rendered)) {
  check(`${name} produced both parts`, body.html.length > 500 && body.text.length > 50,
    `${body.html.length} / ${body.text.length} chars`);
}

// --- optionally write them out for eyeballing --------------------------------
const writeIndex = process.argv.indexOf("--write");
if (writeIndex !== -1) {
  const dir = path.resolve(process.argv[writeIndex + 1] ?? "email-preview");
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(rendered)) {
    writeFileSync(path.join(dir, `${name}.html`), body.html, "utf8");
    writeFileSync(path.join(dir, `${name}.txt`), body.text, "utf8");
  }
  console.log(`\nwrote 10 files to ${dir}`);
}

const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} email checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
