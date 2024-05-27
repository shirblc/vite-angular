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
import fs, { readFileSync } from "fs";
import typescript from "typescript";
const { transpileModule } = typescript;

/**
 * Replaces the templateUrl in an Angular component, either with an inlined plugin or with a new URL.
 * Originally written as a Browserify transform: https://github.com/shirblc/angular-gulp/pull/1
 * and later as rollup plugin:
 * https://github.com/shirblc/angular-gulp/blob/main/processor.js#L17
 *
 * @param config Optional configuration for the templates. Contains the following options:
 *  - inlineTemplates - boolean - Whether or not to inline the templates in the final JavaScript bundle.
 *  - newParentFolder - string - The new folder to copy the templates to (starting with "/")
 *  - keepFolderStructure - boolean - Whether to maintain Angular's default "/src/app/components/<name>"
 *                                    structure or to put all HTML files in the same folder.
 */
export function ReplaceTemplateUrlPlugin(config = { inlineTemplates: true }) {
  return {
    name: "vite-plugin-template-url-replacement",
    /**
     * Transform hook for Rollup.
     * Transforms the Template URL into a new URL or the inlined template,
     * depending on the user's configuration.
     * @param code - the code passed in by Rollup.
     * @returns the updated code and the sourcemap.
     */
    transform(code) {
      const magicString = new MagicString(code);

      magicString.replace(/(templateUrl:)(.*)(.component.html")/, (match) => {
        const component = match.match(/(\.\/)(.*)(\.component\.html)/);
        if (!component) return match;
        const componentName = component[2];
        if (componentName == "my") return match;

        const componentTemplateURL =
          componentName == "app"
            ? `./src/app/${componentName}.component.html`
            : `./src/app/components/${componentName}/${componentName}.component.html`;

        if (!config.inlineTemplates && config.newParentFolder) {
          if (!config.keepFolderStructure) return match.replace("./", config.newParentFolder);
          else
            return componentName == "app"
              ? match.replace("./", `/${config.newParentFolder}`)
              : match.replace(`./`, `/components/${componentName}/${config.newParentFolder}`);
        } else {
          if (!config.inlineTemplates)
            console.log(
              "Inline templates option is false but no parent folder has been provided. Inlining the templates instead.",
            );

          const componentTemplate = fs.readFileSync(componentTemplateURL);
          return `template: \`${componentTemplate}\``;
        }
      });

      return {
        code: magicString.toString(),
        map: magicString.generateMap(),
      };
    },
    // Based on: https://github.com/vite-pwa/vite-plugin-pwa/blob/main/src/plugins/dev.ts
    /**
     * configureServer hook for Vite.
     * If the user chose not to inline the templates in development, serves the template
     * files when requested.
     * @param server - the Vite dev server
     */
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.match(/\/(\w*)\.component\.html/)) {
          const componentName = req.url.match(/\/(\w*)\.component\.html/);
          const componentTemplateURL =
            componentName[1] == "app"
              ? `./src/app/${componentName[1]}.component.html`
              : `./src/app/components/${componentName[1]}/${componentName[1]}.component.html`;

          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html");
          res.write(fs.readFileSync(componentTemplateURL), "utf-8");
          res.end();
        } else {
          next();
        }
      });
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

        const transpiled = transpileModule(tempString, {
          fileName: id,
          compilerOptions,
        });

        magicString.overwrite(0, code.length, transpiled.outputText);

        return {
          code: magicString.toString(),
          map: magicString.generateMap(),
        };
      }
    },
  };
}
