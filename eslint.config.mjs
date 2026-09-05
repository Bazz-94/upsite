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
    "coverage/**",
  ]),
  {
    files: ["**/*.{js,mjs,jsx,ts,tsx}"],
    rules: {
      // Cap cyclomatic complexity per function.
      complexity: ["error", { max: 10 }],
      "max-depth": ["warn", 6],
      "max-lines-per-function": ["warn", { "max": 50, "skipBlankLines": true, "skipComments": true }],
    },
  },
]);

export default eslintConfig;
