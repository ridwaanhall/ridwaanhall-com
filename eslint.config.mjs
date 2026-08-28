import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated, like `next-env.d.ts` beside it: `.open-next/` is the built
    // Worker, and `cloudflare-env.d.ts` is 15k lines of workerd runtime types
    // written by `npm run cf-typegen`. It ships its own blanket
    // `eslint-disable`, which this config then reports as unused.
    ".open-next/**",
    "cloudflare-env.d.ts",
  ]),
]);

export default eslintConfig;
