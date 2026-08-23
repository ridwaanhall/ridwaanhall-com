/**
 * What a deployment has been given, and what it is quietly doing without.
 *
 * Every other harness here checks the code, against a dev server holding a
 * complete `.env.local`. This one asks a different question of a real
 * deployment: which features are switched off because a variable never made it
 * into the environment?
 *
 * That question needs asking separately because this application is built to
 * degrade rather than crash. A dashboard panel whose API key is missing simply
 * does not render. A contact form whose Turnstile keys are missing renders
 * without the widget, submits happily, and skips verification. None of it
 * throws, nothing appears in a log, and every page returns 200 -- so a
 * deployment can be substantially hollow and look completely healthy.
 *
 * Three of these were live at once on the first deployment of this site:
 * sign-in was dead, the spam gate was open, and half the dashboard was absent.
 * All three were one unset variable each, and none was visible from a status
 * code.
 *
 *   node scripts/check-live-config.mjs https://<domain>
 *
 * Read-only: it fetches pages and submits nothing.
 *
 * **Build-time and runtime are different repairs, so each failure says which.**
 * A `NEXT_PUBLIC_` variable is inlined into the bundle when the build runs, so
 * setting one and redeploying the existing build changes nothing -- it has to
 * be built again. The rest are read per request, and a redeploy is enough.
 */

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `\n          ${detail}`}`);
};

const body = async (path) => {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { status: response.status, text: await response.text() };
};

console.log(`What ${BASE} has been given\n`);

try {
  /* ----------------------------------------------------------- sign-in */
  const csrf = await fetch(`${BASE}/api/auth/csrf`, { redirect: "manual" });
  check(
    csrf.status === 200,
    "sign-in is configured",
    "AUTH_SECRET (runtime) -- without it every sign-in ends at ?error=Configuration, " +
      "while the rest of the site behaves normally",
  );

  /* --------------------------------------------------------- turnstile */
  const contact = await body("/contact");
  const widget = contact.text.includes("cf-turnstile");
  check(
    widget,
    "the contact form carries its spam widget",
    "NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY (build time -- needs a rebuild, not a redeploy).\n" +
      "          Worse than a missing widget: with CF_TURNSTILE_SECRET_KEY also unset,\n" +
      "          verifyTurnstile() returns true and the form has no spam check at all.",
  );

  /* --------------------------------------------------------- dashboard */
  const dashboard = await body("/dashboard");
  check(
    dashboard.text.includes("WakaTime Statistics"),
    "the dashboard's WakaTime panel renders",
    "WAKATIME_API_KEY (runtime) -- the panel is absent rather than broken",
  );
  check(
    dashboard.text.includes("GitHub Statistics"),
    "the dashboard's GitHub panel renders",
    "GITHUB_ACCESS_TOKEN (runtime) -- the panel is absent rather than broken",
  );

  /* ------------------------------------------------------------- media */
  const home = await body("/");
  const media = home.text.match(/https?:\/\/[\w-]+\.supabase\.co\/[^"'\\ ]+/);
  check(
    Boolean(media),
    "uploaded media is served from the storage host",
    "STORAGE_SUPABASE_URL (build time and runtime) -- images fall back to nothing",
  );
  if (media) {
    // The URL being in the markup is not the same as the object being there.
    const asset = await fetch(media[0].replace(/&amp;/g, "&"), { method: "HEAD" });
    check(asset.ok, "and the object actually exists", `${asset.status} for ${media[0].slice(0, 80)}`);
  }

  /* --------------------------------------------------------- canonical */
  const canonical = home.text.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
  if (new URL(BASE).hostname === "localhost") {
    /*
      A dev server is supposed to disagree here. `NEXT_PUBLIC_BASE_URL` names
      the public site in every environment -- a canonical pointing at localhost
      would be the actual bug -- so asserting equality against a dev server
      fails for being correct, and a check that cries wolf is one nobody runs.
    */
    console.log(`  ..    canonical is ${canonical || "unset"}, not compared against a dev server`);
  } else {
    check(
      canonical.startsWith(BASE),
      "the canonical URL names this site",
      `NEXT_PUBLIC_BASE_URL (build time) -- it says ${canonical || "nothing"}, ` +
        `which is what every sitemap entry and every og:url will say too`,
    );
  }
} catch (error) {
  failures++;
  console.log(`  FAIL  ${error.message}`);
  console.log(`\nIs ${BASE} reachable?`);
}

console.log(
  failures === 0
    ? "\nEvery environment-dependent feature is switched on."
    : `\n${failures} feature(s) are silently off. Each names the variable and where it is read.`,
);
process.exit(failures === 0 ? 0 : 1);
