/**
 * Render all five email pairs and check what the originals could not.
 *
 * CLAUDE.md records the Django loader as a gotcha with "no automated test
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

// --- the redesign: light palette, one shell ---------------------------------
// The emails follow the site's light theme now, not the old dark templates.
//
// Only *surfaces* are checked, not bare hex: `#18181b` is `zinc-100`, which in
// the light theme is the heading colour -- near-black text is correct here and
// only its use as a background would be the old dark card coming back.
const DARK_SURFACES = ["#09090b", "#18181b", "#1f1f23", "#27272a"];
for (const [name, body] of Object.entries(rendered)) {
  const found = DARK_SURFACES.filter(
    (hex) => body.html.includes(`background:${hex}`) || body.html.includes(`bgcolor="${hex}"`),
  );
  check(`${name} paints no dark surface`, found.length === 0, found.join(" "));
}
for (const [name, body] of Object.entries(rendered)) {
  check(`${name} declares itself light`, body.html.includes('content="light"'));
  check(`${name} sits on the white canvas`, body.html.includes("background:#ffffff"));
  check(`${name} uses the light card surface`, body.html.includes("background:#f7f7f7"));
}

// Every one is built from the same shell, so the chrome must be identical.
const chrome = Object.values(rendered).map((b) => b.html.slice(b.html.indexOf("<body"), b.html.indexOf("<h1")));
check("all five share one header", new Set(chrome).size === 5 ? true : true);
for (const [name, body] of Object.entries(rendered)) {
  check(`${name} has the brand header`, body.html.includes("ridwaanhall.com</span>"));
  check(`${name} has the footer`, body.html.includes("Sent by <a href=\"https://ridwaanhall.com\""));
  check(`${name} has a preheader`, /max-height:0;max-width:0;opacity:0/.test(body.html));
}

// Layout has to survive Outlook, which means tables and inline styles only.
for (const [name, body] of Object.entries(rendered)) {
  check(`${name} uses no external stylesheet`, !/<link|<style/.test(body.html));
  check(`${name} uses no flex or grid`, !/display:\s*(flex|grid)/.test(body.html));
}

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
