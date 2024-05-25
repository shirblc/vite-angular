import MagicString from "magic-string";
import fs, { readFileSync } from "fs";
import { Plugin } from "vite";
import typescript from "typescript";
const { transpileModule } = typescript;

interface ReplacerConfig {
  inlineTemplates: boolean;
  newParentFolder?: string;
  keepFolderStructure?: boolean;
}

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
export function ReplaceTemplateUrlPlugin(config: ReplacerConfig = { inlineTemplates: true }): Plugin {
  return {
    name: 'vite-plugin-template-url-replacement',
    /**
     * Transform hook for Rollup. 
     * Transforms the Template URL into a new URL or the inlined template,
     * depending on the user's configuration.
     * @param code - the code passed in by Rollup.
     * @returns the updated code and the sourcemap.
     */
    transform(code) {
      const magicString  = new MagicString(code);

      magicString.replace(/(templateUrl:)(.*)(.component.html")/, (match) => {
        const component = match.match(/(\.\/)(.*)(\.component\.html)/);
        if(!component) return match;
        const componentName = component[2];
        if(componentName == 'my') return match;

        const componentTemplateURL = componentName == 'app'
          ? `${__dirname}/src/app/${componentName}.component.html`
          : `${__dirname}/src/app/components/${componentName}/${componentName}.component.html`;

        if (!config.inlineTemplates && config.newParentFolder) {
          if (!config.keepFolderStructure)
            return match.replace("./", config.newParentFolder);
          else
            return componentName == 'app'
              ? match.replace("./", `/${config.newParentFolder}`)
              : match.replace(`./`, `/components/${componentName}/${config.newParentFolder}`);
        } else {
          if (!config.inlineTemplates)
            console.log("Inline templates option is false but no parent folder has been provided. Inlining the templates instead.");
          
          const componentTemplate = fs.readFileSync(componentTemplateURL);
          return `template: \`${componentTemplate}\``;
        }
        
      })

      return {
        code: magicString.toString(),
        map: magicString.generateMap()
      }
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
          const componentName = req.url.match(/\/(\w*)\.component\.html/)!;
          const componentTemplateURL = componentName[1] == 'app'
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
  }
};

/**
 * A plugin for transpiling the TypeScript files (including the decorators).
 * Seeing as ESBuild doesn't support the experimental decorators, we need to
 * transpile the TypeScript decorators - and by extension whole files - ourselves.
 * This only applies in development, as the production build uses rollup.
 */
export function TranspileDecoratorsVite(): Plugin {
  return {
    name: "vite-plugin-transpile-decorators",
    enforce: "pre",
    apply: "serve",
    transform(code, id) {
      if (id.endsWith(".ts")) {
        const magicString = new MagicString(code);
        const tempString = magicString.toString();
        const tsConfigString = readFileSync("./tsconfig.json", {encoding: "utf8"});
        const compilerOptions = JSON.parse(tsConfigString)["compilerOptions"];

        const transpiled = transpileModule(tempString, {
          fileName: id,
          compilerOptions,
        });

        magicString.overwrite(0, code.length, transpiled.outputText);

        return {
          code: magicString.toString(),
          map: magicString.generateMap()
        };
      }
    }
  }
}
