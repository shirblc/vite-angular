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
export default class AngularBuilder {
  /**
   * Creates a new AngularBuilder.
   * @param env - The current environment.
   * @param testEnv - Which environment to use as a base for tests. The selected environment's plugins will be copied to the test plugins and run as part of the test build.
   * @param tsConfigPath - the path to the tsconfig.json file.
   * @param plugins - a list of plugins to apply during the build.
   */
  constructor(env, testEnv, tsConfigPath, plugins = []) {
    this.env = "dev";
    this.currentAngularProgram = undefined;
    const { options, rootNames: parsedFiles } = readConfiguration(tsConfigPath, {
      noEmit: false,
    });
    this.compilerOptions = options;
    this.rootFiles = parsedFiles;
    this.env = env;
    this.testEnv = testEnv;
    this.tsConfigPath = tsConfigPath;
    this.pluginMapping = {
      dev: { read: [], "post-transform": [] },
      production: { read: [], "post-transform": [] },
      test: { read: [], "post-transform": [] },
    };
    plugins.forEach((plugin) => {
      if (plugin.apply == this.env || (this.env == "test" && plugin.apply == this.testEnv)) {
        this.pluginMapping[plugin.apply][plugin.stage].push(plugin);
        if (plugin.apply == this.testEnv) this.pluginMapping["test"][plugin.stage].push(plugin);
        if (plugin.setup) plugin.setup(env);
      }
    });
    this.setupCompilerHost();
  }
  /**
   * Sets up the TypeScript compiler host and the Angular compiler host.
   */
  setupCompilerHost() {
    const tsConfig = readFileSync(this.tsConfigPath, { encoding: "utf-8" });
    const tsConfigJson = JSON.parse(tsConfig);
    this.tsHost = ts.createCompilerHost(tsConfigJson["compilerOptions"]);
    const originalReadFile = this.tsHost.readFile;
    // Override the host's readFile function to edit the file before it goes through
    // the TypeScript compiler.
    this.tsHost.readFile = (name) => {
      let res = originalReadFile.call(this.tsHost, name);
      this.pluginMapping[this.env].read.forEach((plugin) => {
        const output = plugin.transform(name, res);
        if (output) res = output;
        else console.warn(`Plugin ${plugin.name} returned no output and was ignored.`);
      });
      return res;
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
    if (!this.compilerHost) {
      throw new Error(
        "The compiler host must be initialised before the Angular program is set up. Did you forget to call `builder.setupCompilerHost`?",
      );
    }
    if (!this.tsHost) {
      throw new Error(
        "The TypeScript host must be initialised before the Angular program is set up. Did you forget to call `builder.setupCompilerHost`?",
      );
    }
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
    if (!this.tsHost) {
      throw new Error(
        "The TypeScript host must be initialised before the Angular program is set up. Did you forget to call `builder.setupCompilerHost`?",
      );
    }
    await this.currentAngularProgram.compiler.analyzeAsync();
    const diagnostics = this.currentAngularProgram.compiler.getDiagnostics();
    const res = ts.formatDiagnosticsWithColorAndContext(diagnostics, this.tsHost);
    if (res) console.warn(res);
    return res;
  }
  /**
   * Compiles the given file using the Angular compiler.
   * @param fileId the ID of the file to compile.
   * @returns a MagicString with the transform result and a source map.
   */
  buildFile(fileId) {
    // Credit to @nitedani for the next four lines
    // https://github.com/nitedani/vite-plugin-angular
    const transformers = this.currentAngularProgram.compiler.prepareEmit();
    let output = "";
    if (!/\.[cm]?tsx?$/.test(fileId)) return;
    let sourceFile = this.builder?.getSourceFile(fileId);
    if (!sourceFile) return;
    const magicString = new MagicString(sourceFile.text);
    // Credit to @nitedani for this
    // https://github.com/nitedani/vite-plugin-angular
    this.builder?.emit(
      sourceFile,
      (_filename, data) => {
        if (data) output = data;
      },
      undefined,
      undefined,
      transformers.transformers,
    );
    this.pluginMapping[this.env]["post-transform"].forEach((plugin) => {
      const result = plugin.transform(fileId, output);
      if (result) output = result;
      else console.warn(`Plugin ${plugin.name} returned no output and was ignored.`);
    });
    magicString.overwrite(0, magicString.length(), output);
    return magicString;
  }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlci5iYXNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2J1aWxkZXIuYmFzZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXNCRTtBQUVGLE9BQU8sV0FBVyxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBR0wsa0JBQWtCLEVBQ2xCLGFBQWEsRUFFYixpQkFBaUIsR0FDbEIsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQixPQUFPLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFDNUIsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLFNBQVMsQ0FBQztBQWtCdkMsTUFBTSxDQUFDLE9BQU8sT0FBTyxjQUFjO0lBZ0JqQzs7Ozs7O09BTUc7SUFDSCxZQUNFLEdBQWdCLEVBQ2hCLE9BQTZCLEVBQzdCLFlBQW9CLEVBQ3BCLFVBQTJCLEVBQUU7UUExQi9CLFFBQUcsR0FBZ0IsS0FBSyxDQUFDO1FBSXpCLDBCQUFxQixHQUE2QixTQUFTLENBQUM7UUF3QjFELE1BQU0sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsRUFBRSxHQUFHLGlCQUFpQixDQUFDLFlBQVksRUFBRTtZQUMxRSxNQUFNLEVBQUUsS0FBSztTQUNkLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDO1FBQy9CLElBQUksQ0FBQyxTQUFTLEdBQUcsV0FBVyxDQUFDO1FBQzdCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDdkIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLGFBQWEsR0FBRztZQUNuQixHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLGdCQUFnQixFQUFFLEVBQUUsRUFBRTtZQUN2QyxVQUFVLEVBQUUsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLGdC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
