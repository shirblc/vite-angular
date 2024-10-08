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

import MagicString from "magic-string";
import { createCompilerHost, createProgram, readConfiguration } from "@angular/compiler-cli";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { transformSync } from "@babel/core";
import { createFilter } from "vite";

export default class AngularBuilder {
  compilerHost;
  compilerOptions;
  currentAngularProgram = undefined;
  tsHost;
  builder;
  rootFiles;
  tsConfigPath;
  filter;

  /**
   * Creates a new AngularBuilder.
   * @param { string } tsConfigPath - the path to the tsconfig.json file.
   * @param { {include: string[], exclude: string[]} } coverageConf - coverage config.
   */
  constructor(tsConfigPath, coverageConf) {
    const { options, rootNames: parsedFiles } = readConfiguration(tsConfigPath, {
      noEmit: false,
    });
    this.compilerOptions = options;
    this.rootFiles = parsedFiles;
    this.tsConfigPath = tsConfigPath;
    this.filter = createFilter(coverageConf.include, coverageConf.exclude);
  }

  /**
   * Sets up the TypeScript compiler host and the Angular compiler host.
   */
  async setupCompilerHost() {
    const tsConfig = readFileSync(this.tsConfigPath, { encoding: "utf-8" });
    const tsConfigJson = JSON.parse(tsConfig);
    this.tsHost = ts.createCompilerHost(tsConfigJson["compilerOptions"]);
    const originalReadFile = this.tsHost.readFile;
    // Override the host's readFile function to add an coverage if necessary.
    this.tsHost.readFile = (name) => {
      const res = originalReadFile.call(this.tsHost, name);
      if (!res) return;

      // Filter out files that don't need to be instrumented
      if (!this.filter(name)) return res;

      const instrumentedRes = transformSync(res, {
        filename: name,
        plugins: [
          ["istanbul"],
          ["@babel/plugin-syntax-decorators", { decoratorsBeforeExport: true }],
          ["@babel/plugin-syntax-typescript"],
        ],
        sourceMaps: "inline",
      })?.code;

      return instrumentedRes;
    };
    this.compilerHost = createCompilerHost({
      options: { ...this.compilerOptions },
      tsHost: this.tsHost,
    });
  }

  /**
   * Creates the Angular program and the TypeScript builder.
   */
  setupAngularProgram() {
    this.currentAngularProgram = createProgram({
      rootNames: this.rootFiles,
      options: this.compilerOptions,
      host: this.compilerHost,
      oldProgram: this.currentAngularProgram,
    });

    // Credit to @nitedani for the next two lines
    // https://github.com/nitedani/vite-plugin-angular
    const typeScriptProgram = this.currentAngularProgram.getTsProgram();
    this.builder = ts.createAbstractBuilder(typeScriptProgram, this.tsHost);
  }

  /**
   * Validates the app using the Angular Compiler.
   * @returns the Angular Compiler's analysis result.
   *
   * Credit to nitedani for most of the transform
   * https://github.com/nitedani/vite-plugin-angular
   */
  async validateFiles() {
    if (!this.currentAngularProgram) return;

    await this.currentAngularProgram.compiler.analyzeAsync();
    const diagnostics = this.currentAngularProgram.compiler.getDiagnostics();
    const res = ts.formatDiagnosticsWithColorAndContext(diagnostics, this.tsHost);

    if (res) console.warn(res);

    return res;
  }

  /**
   * Compiles the given file using the Angular compiler.
   * @param { string } fileId the ID of the file to compile.
   * @returns a MagicString with the transform result and a source map.
   */
  buildFile(fileId) {
    // Credit to @nitedani for the next four lines
    // https://github.com/nitedani/vite-plugin-angular
    const transformers = this.currentAngularProgram.compiler.prepareEmit();
    let output = "";

    if (!/\.[cm]?tsx?$/.test(fileId)) return;

    const sourceFile = this.builder.getSourceFile(fileId);

    if (!sourceFile) return;

    const magicString = new MagicString(sourceFile.text);

    // Credit to @nitedani for this
    // https://github.com/nitedani/vite-plugin-angular
    this.builder.emit(
      sourceFile,
      (_filename, data) => {
        if (data) output = data;
      },
      undefined,
      undefined,
      transformers.transformers,
    );

    magicString.overwrite(0, magicString.length(), output);

    return magicString;
  }
}
