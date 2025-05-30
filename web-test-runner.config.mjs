/*
  MIT License

  Copyright (c) 2020-2024 Shir Bar Lev

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defaultReporter } from "@web/test-runner";
import { playwrightLauncher } from "@web/test-runner-playwright";
import { esbuildPlugin } from "@web/dev-server-esbuild";
import { fromRollup } from "@web/dev-server-rollup";
import tsConfigPaths from "rollup-plugin-tsconfig-paths";
import { AngularTestsPlugin } from "./plugins/wtr.js";
import { chromeLauncher } from "@web/test-runner-chrome";

const configPaths = fromRollup(tsConfigPaths);
const compileAngular = fromRollup(AngularTestsPlugin);

/** @type {import("@web/test-runner").TestRunnerConfig} */
export default {
  reporters: [defaultReporter({ reportTestResults: true, reportTestProgress: true })],
  coverage: true,
  files: ["src/**/*.spec.ts", "!plugins/tests.ts"],
  browsers: [
    // Commented out until https://github.com/modernweb-dev/web/issues/2777 is resolved
    // playwrightLauncher({
    //   product: "chromium",
    //   args: [
    //     "--disable-gpu",
    //     "--no-sandbox",
    //     "--disable-setuid-sandbox",
    //     "--disable-extensions",
    //     "--disable-dev-shm-usage",
    //   ],
    // }),
    // playwrightLauncher({ product: 'webkit' }),
    // playwrightLauncher({ product: 'firefox' }),
    chromeLauncher({
      launchOptions: {
        headless: true,
        devtools: false,
      },
    }),
  ],
  nodeResolve: true,
  coverageConfig: {
    include: ["src/**/*.ts"],
    exclude: [
      "node_modules/**",
      "src/**/*.spec.ts",
      "src/main.ts",
      "src/app/app.config.ts",
      "src/app/app.routes.ts",
      "src/polyfills.ts",
      "src/assets/*",
      "plugins/tests.ts",
      "tests/*",
    ],
    report: true,
    reportDir: "./coverage",
    reporters: ["html", "lcovonly", "text-summary"],
    nativeInstrumentation: false,
  },
  // Credit to @blueprintui for most of the HTML.
  // https://github.com/blueprintui/web-test-runner-jasmine/blob/main/src/index.ts
  testRunnerHtml: (_path, _config) => fs.readFileSync("./plugins/tests.html", { encoding: "utf8" }),
  testsStartTimeout: 5000,
  testsFinishTimeout: 5000,
  debug: false,
  testFramework: {
    config: {
      defaultTimeoutInterval: 5000,
      random: true,
    },
  },
  plugins: [
    configPaths({}),
    compileAngular(),
    esbuildPlugin({
      target: "es2020",
      ts: true,
      tsconfig: fileURLToPath(new URL("./tsconfig.json", import.meta.url)),
    }),
  ],
};
