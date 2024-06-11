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

  The provided Software is separate from the idea behind its website. The Send A Hug
  website and its underlying design and ideas are owned by Send A Hug group and
  may not be sold, sub-licensed or distributed in any way. The Software itself may
  be adapted for any purpose and used freely under the given conditions.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

import MagicString from "magic-string";
import { Plugin } from "vite";
import {
  CompilerHost as ngCompilerHost,
  CompilerOptions as ngCompilerOptions,
  createCompilerHost,
  createProgram,
  NgtscProgram,
  readConfiguration,
} from "@angular/compiler-cli";
import { transformAsync } from "@babel/core";
import defaultLinkerPlugin from "@angular/compiler-cli/linker/babel";
import ts from "typescript";
import * as tsconfig from "./tsconfig.json";

/**
 * A plugin that runs the Angular compiler in order to build the app.
 * @returns A Vite plugin for building the app.
 */
export function BuildAngularPlugin(): Plugin {
  let isDev = false;
  let compilerHost: ngCompilerHost;
  let compilerOptions: ngCompilerOptions;
  let currentAngularProgram: NgtscProgram;
  let tsHost: ts.CompilerHost;
  let builder: ts.BuilderProgram;
  let rootFiles: string[];

  async function validateFiles() {
    await currentAngularProgram.compiler.analyzeAsync();
    const diagnostics = currentAngularProgram.compiler.getDiagnostics();
    const res = ts.formatDiagnosticsWithColorAndContext(diagnostics, tsHost);

    if (res) console.warn(res);

    return res;
  }

  return {
    name: "vite-build-angular",
    enforce: "pre",

    /**
     * Vite's config hook. Used to handle the TypeScript config,
     * the Angular compiler config, and to perform a check for whether
     * we're in development or in production.
     */
    config(_config, env) {
      isDev = env.command == "serve";
      const { options, rootNames: parsedFiles } = readConfiguration("./tsconfig.json", {
        noEmit: false,
      });
      compilerOptions = options;
      rootFiles = parsedFiles;
    },

    /**
     * Vite's build start hook. Is used to initialise the TypeScript compiler
     * host and builder, as well as the Angular compiler.
     */
    async buildStart(_options) {
      tsHost = ts.createCompilerHost(tsconfig["compilerOptions"] as any);
      compilerHost = createCompilerHost({
        options: { ...compilerOptions },
        tsHost,
      });
      currentAngularProgram = createProgram({
        rootNames: rootFiles,
        options: compilerOptions,
        host: compilerHost,
      }) as NgtscProgram;
      // Credit to @nitedani for the next four lines
      // https://github.com/nitedani/vite-plugin-angular
      const typeScriptProgram = currentAngularProgram.getTsProgram();
      builder = ts.createAbstractBuilder(typeScriptProgram, tsHost);

      const validateResult = await validateFiles();

      if (validateResult) {
        process.exit(1);
      }
    },

    /**
     * Vite's transform hook. Performs the actual transformation of the
     * Angular code using the Compiler created in the buildStart hook.
     */
    async transform(_code, id, _options) {
      // Credit to @nitedani for most of the transform
      // https://github.com/nitedani/vite-plugin-angular
      const validateResult = await validateFiles();

      if (validateResult && !isDev) {
        process.exit(1);
      }

      const transformers = currentAngularProgram.compiler.prepareEmit();
      let output: string = "";

      if (!/\.[cm]?tsx?$/.test(id)) return;

      const sourceFile = builder.getSourceFile(id);

      if (!sourceFile) return;

      const magicString = new MagicString(sourceFile.text);

      if (id.includes("main.ts") && isDev) {
        magicString.prepend("import '@angular/compiler';");
      }

      builder.emit(
        sourceFile,
        (_filename, data) => {
          if (data) output = data;
        },
        undefined,
        false,
        transformers.transformers,
      );

      magicString.overwrite(0, magicString.length(), output);

      return {
        code: magicString.toString(),
        map: magicString.generateMap(),
      };
    },
  };
}

/**
 * A plugin for applying the Angular linker plugin (using Babel).
 * See https://angular.dev/tools/libraries/creating-libraries#consuming-partial-ivy-code-outside-the-angular-cli.
 * Doesn't currently work!
 */
export function addAngularLinkerPlugin(): Plugin {
  return {
    name: "vite-add-angular-linker",
    enforce: "pre",
    apply: "serve",

    async transform(code, id, _options) {
      // add in the angular linker
      // TODO: Figure out why this isn't working
      // Filter out non-JS/TS files as they don't need to be linked
      if (!/\.(js|ts)x?$/.test(id)) return;

      const finalResult = await transformAsync(code, {
        filename: id,
        sourceMaps: true,
        configFile: false,
        babelrc: false,
        compact: false,
        browserslistConfigFile: false,
        plugins: [defaultLinkerPlugin],
      });

      return {
        code: finalResult?.code ?? "",
        map: finalResult?.map,
      };
    },
  };
}
