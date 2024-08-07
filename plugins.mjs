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
import fs, { readFileSync } from "fs";
import typescript from "typescript";
import less from "less";
import { loadEnv } from "vite";
const { transpileModule } = typescript;

/**
 * Replaces the templateUrl and styleUrl in an Angular component with the inlined data.
 * Originally written as a Browserify transform: https://github.com/shirblc/angular-gulp/pull/1
 * and later as rollup plugin:
 * https://github.com/shirblc/angular-gulp/blob/main/processor.js#L17
 */
export function ReplaceTemplateUrlPlugin() {
  /**
   * Gets the path to the component's directory.
   * @param {string} id - the ID of the file being processed.
   * @returns - a string of the path to the component's directory.
   */
  function extractComponentDirectory(id) {
    const directoryUrlMatch = id.match(/\/([a-zA-Z])+\.component.ts/);
    let directoryUrl = "./src/app";
    if (directoryUrlMatch) directoryUrl = id.substring(0, directoryUrlMatch.index);
    return directoryUrl;
  }

  return {
    name: "vite-plugin-template-url-replacement",
    /**
     * Transform hook for Rollup.
     * Transforms the Template URL into a new URL or the inlined template,
     * depending on the user's configuration.
     * @param code - the code passed in by Rollup.
     * @returns the updated code and the sourcemap.
     */
    async transform(code, id) {
      const magicString = new MagicString(code);

      magicString.replace(/(templateUrl:)(.*)(.component.html")/, (match) => {
        // Get the absolute URL to the component
        const directoryUrl = extractComponentDirectory(id);
        const component = match.match(/(\.\/)(.*)(\.component\.html)/);
        if (!component) return match;
        const componentName = component[2];
        if (componentName == "my") return match;

        const componentTemplateURL = `${directoryUrl}/${componentName}.component.html`;
        const componentTemplate = fs.readFileSync(componentTemplateURL);
        return `template: \`${componentTemplate}\``;
      });

      const hasStylesheet = code.includes("styleUrl:");
      let cssStyle = undefined;

      if (hasStylesheet) {
        // Get the absolute URL to the component
        const directoryUrl = extractComponentDirectory(id);
        const component = id.match(/(\.\/)(.*)(\.component\.ts)/);
        if (component) {
          const componentName = component[2];
          if (componentName != "my") {
            const componentStyleURL = `${directoryUrl}/${componentName}.component.less`;
            const lessCode = fs.readFileSync(componentStyleURL, { encoding: "utf-8" });
            cssStyle = await less.render(lessCode, { paths: [globalStylesDir] });
          }
        }
      }

      magicString.replace(/(styleUrl:)(.*)(.component.less")/, `styles: \`${cssStyle}\``);

      return {
        code: magicString.toString(),
        map: magicString.generateMap(),
      };
    },
  };
}

/**
 * A plugin for transpiling the TypeScript files (including the decorators).
 * Seeing as ESBuild doesn't support the experimental decorators, we need to
 * transpile the TypeScript decorators - and by extension whole files - ourselves.
 * This only applies in development, as the production build uses rollup.
 */
export function TranspileDecoratorsVite() {
  return {
    name: "vite-plugin-transpile-decorators",
    transform(code, id) {
      if (id.endsWith(".ts")) {
        const magicString = new MagicString(code);
        magicString.prepend("import 'zone.js';\n");
        magicString.prepend("import 'reflect-metadata';\n");
        magicString.prepend("import '@angular/compiler';\n");
        const tempString = magicString.toString();
        const tsConfigString = readFileSync("./tsconfig.json", { encoding: "utf8" });
        const compilerOptions = JSON.parse(tsConfigString)["compilerOptions"];
        compilerOptions["emitDecoratorMetadata"] = true;

        const transpiled = transpileModule(tempString, {
          fileName: id,
          compilerOptions,
        });

        const env = loadEnv("development", ".");

        magicString.overwrite(0, code.length, transpiled.outputText);
        magicString.prepend(`import.meta.env = ${JSON.stringify(env)};\n`);

        return {
          code: magicString.toString(),
          map: magicString.generateMap(),
        };
      }
    },
  };
}
