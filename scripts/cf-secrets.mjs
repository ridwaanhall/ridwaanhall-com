/**
 * Loads the Worker's runtime secrets from `.env` / `.env.local`.
 *
 *   node scripts/cf-secrets.mjs              # upload them
 *   node scripts/cf-secrets.mjs --dry-run    # list what would be sent
 *   node scripts/cf-secrets.mjs --origin https://staging.example.com
 *
 * **It spawns wrangler itself and writes to its stdin rather than printing
 * anything for a shell to pipe.** That is not tidiness, it is the only version
 * that works: piping between two native commands in PowerShell re-encodes the
 * stream and prepends a UTF-8 byte order mark, and `wrangler secret bulk` then
 * rejects the payload as malformed JSON. The same command in bash is fine,
 * which is exactly the kind of difference that gets found in production.
 *
 * It also means no secret is ever written to a file, printed to a terminal, or
 * left in shell history. Values do not appear in this script's output under any
 * flag -- `--dry-run` prints names and a count, and nothing else.
 *
 * The Worker's environment is not the local one, and the differences are the
 * point of the list below:
 *
 * - `STORAGE_POSTGRES_URL` is absent. A Worker cannot verify Supabase's
 *   certificate, so the URL names a route that cannot work from there;
 *   `lib/db/client.ts` reaches for the HYPERDRIVE binding instead, and an unset
 *   variable is what keeps that unambiguous. The *build* still needs it, which
 *   is a separate setting on the Workers Builds configuration.
 * - No `NEXT_PUBLIC_` key is here. Those are inlined into the bundle by
 *   `next build`, so a runtime secret carrying one has no effect whatsoever --
 *   they belong in the build configuration too.
 * - `AUTH_URL` is overridden rather than copied. Auth.js builds absolute URLs
 *   from it unconditionally, so the local value would send anyone signing out
 *   of this deployment to a different host.
 *
 * The Worker's name is not repeated here: `wrangler secret bulk` reads it from
 * `wrangler.jsonc`, which is the one place it is declared.
 */
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";

const DEFAULT_ORIGIN = "https://v3.ridwaanhall.com";

/** Everything the Worker reads at runtime, and nothing it does not. */
const KEYS = [
  "STORAGE_SUPABASE_URL",
  "STORAGE_SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET",
  "AUTH_SECRET",
  "AUTH_URL",
  "AUTH_TRUST_HOST",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "GITHUB_ACCESS_TOKEN",
  "WAKATIME_API_KEY",
  "CF_TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "DEFAULT_FROM_EMAIL",
  "CONTACT_EMAIL_RECIPIENT",
];

/**
 * Read in the order Next reads them, so the value that wins here is the value
 * `next dev` would have used.
 */
function readEnvFiles() {
  const values = {};
  for (const file of [".env", ".env.local"]) {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const line of text.split(/\r?\n/)) {
      const match = /^([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line.trim());
      if (!match) continue;
      values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
  return values;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const originFlag = args.indexOf("--origin");
const origin = originFlag === -1 ? DEFAULT_ORIGIN : args[originFlag + 1];

if (!origin) {
  console.error("--origin needs a URL.");
  process.exit(1);
}

const env = readEnvFiles();

const secrets = {};
const missing = [];
for (const key of KEYS) {
  const value = key === "AUTH_URL" ? origin : env[key];
  if (value) secrets[key] = value;
  else missing.push(key);
}

if (missing.length > 0) {
  console.error(
    `Missing from .env / .env.local: ${missing.join(", ")}\n` +
      "Nothing was uploaded. Fill them in and run again -- a partial upload is\n" +
      "worse than none, because the Worker then starts and fails somewhere\n" +
      "specific rather than refusing to start at all.",
  );
  process.exit(1);
}

console.error(`${KEYS.length} secrets resolved. AUTH_URL -> ${origin}`);
console.error(KEYS.join(", "));

if (dryRun) {
  console.error("\n--dry-run: nothing uploaded.");
  process.exit(0);
}

/*
 * `shell: true` because on Windows `npx` is a `.cmd`, which is not directly
 * executable. The arguments are constants declared above -- no value from the
 * environment reaches the command line, only wrangler's stdin.
 */
const wrangler = spawn("npx", ["wrangler", "secret", "bulk"], {
  stdio: ["pipe", "inherit", "inherit"],
  shell: true,
});

wrangler.on("error", (error) => {
  console.error(`Could not run wrangler: ${error.message}`);
  process.exit(1);
});

wrangler.on("close", (code) => process.exit(code ?? 1));

wrangler.stdin.end(JSON.stringify(secrets));
