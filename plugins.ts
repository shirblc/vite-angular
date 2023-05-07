import MagicString from "magic-string";
import fs from "fs";
import { Plugin } from "vite";

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
 * Sets the angular environment to production.
 * Originally written as a Browserify transform: 
 * https://github.com/sendahug/send-hug-frontend/blob/dev/gulpfile.js#L233
 * and later as rollup plugin: 
 * https://github.com/shirblc/angular-gulp/blob/main/processor.js#L54
 * 
 * @param mode - string - the mode passed in by Vite.
 */
export function SetProductionEnvPlugin(mode: string): Plugin {
  return {
    name: 'vite-plugin-production-setter',
    /**
     * Transform hook for Rollup.
     * Depending on the mode passed in by Vite, determines whether to 
     * switch Angular to production.
     * @param code - the code passed in by Rollup.
     * @returns the updated code and the sourcemap.
     */
    transform(code) {
      if (mode == "development") return code;

      const magicString = new MagicString(code);
      let tempString = magicString.toString();

      const environment = tempString.match(/environments\/environment/);

      if(environment && environment.index) {
        const start = environment.index;
        const end = start + environment[0].length;
        const newString = `environments/environment.prod`;

        magicString.overwrite(start, end, newString);
      }

      return {
        code: magicString.toString(),
        map: magicString.generateMap()
      }
    }
  }
}
