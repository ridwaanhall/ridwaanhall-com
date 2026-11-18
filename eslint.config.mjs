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
    // A vendored third-party skill, kept byte-for-byte with its upstream so it
    // can be updated by copying; its CommonJS validators are not this app's code.
    ".claude/skills/security-audit/**",
  ]),
]);

export default eslintConfig;
