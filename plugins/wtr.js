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

import { loadEnv } from "vite";
import { resolve } from "node:path";
import AngularBuilder from "./builder/js/builder.base.js";
import { instrumentFiles, addCompiler } from "./builder/js/builderPlugins.js";

export const AngularTestsPlugin = () => {
  let ngBuilder;

  return {
    name: "angular-tests-plugin",
    async buildStart(options) {
      ngBuilder = new AngularBuilder("test", "dev", resolve("./tsconfig.json"), [
        instrumentFiles({
          include: ["src/**/*.ts"],
          exclude: ["node_modules/**", "src/**/*.spec.ts"],
        }),
        addCompiler(),
      ]);
      await ngBuilder.setupCompilerHost();
      ngBuilder.setupAngularProgram();

      await ngBuilder.validateFiles();
    },

    transform(code, id) {
      if (!id.includes("@web/test-runner") && !id.includes("web-dev-server")) {
        const transformResult = ngBuilder.buildFile(resolve(id));

        if (!transformResult) return;

        if (id.includes("src/")) {
          const env = loadEnv("development", ".");
          transformResult.prepend(`import.meta.env = ${JSON.stringify(env)};\n`);
        }

        return {
          code: transformResult.toString(),
          map: transformResult.generateMap(),
        };
      }
    },
  };
};
