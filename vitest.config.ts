import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // These existing suites use Node's own test runner, not Vitest.
    exclude: [...configDefaults.exclude, "scripts/**/*.test.mjs"],
  },
});
