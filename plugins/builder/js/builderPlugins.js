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
import { createFilter } from "@rollup/pluginutils";
import { transformSync } from "@babel/core";
const nameTemplate = "<compName>";
const selectorTemplate = "<compSelector>";
const hmrFooter = `\n\n
import { APP_BOOTSTRAP_LISTENER, createComponent } from "@angular/core";

if (import.meta.hot) {
  if (!globalThis.__componentSelectorMapping) globalThis.__componentSelectorMapping = new Map();
  globalThis.__componentSelectorMapping.set("${nameTemplate}", "${selectorTemplate}");

  import.meta.hot.accept((newModule) => {
    if (!(newModule && globalThis.__app)) return;
    const currentModuleName = Object.keys(newModule)[0];
    const updatedModule = newModule[currentModuleName];
    const currentModuleSelector =
      globalThis.__componentSelectorMapping.get(currentModuleName) ?? "app-root";
    const currentNodes = document.querySelectorAll(currentModuleSelector);

    currentNodes.forEach((node) => {
      const parentElement = node.parentElement;
      const newElement = document.createElement(currentModuleSelector);
      // for(const attr in node.attributes) {
      //   const currentAttr = node.attributes.item(Number(attr));
      //   if (!currentAttr) continue;
      //   newElement.setAttribute(currentAttr.name, currentAttr.value ?? “”);
      // }
      parentElement?.removeChild(node);
      parentElement?.appendChild(newElement);
      const newInstance = createComponent(updatedModule, {
        environmentInjector: globalThis.__app!.injector,
        hostElement: newElement as Element,
      });
      globalThis.__app!.attachView(newInstance.hostView);
      globalThis.__app!.tick();
      globalThis.__app!.components.push(newInstance);
      const listeners = globalThis.__app!.injector.get(APP_BOOTSTRAP_LISTENER, []);
      listeners.forEach((listener) => listener(newInstance));
    });
  });
}
`;
/**
 * Plugin for adding the HMR footer to the end of the file (if the file is
 * a component file).
 */
export function hmrPostPlugin() {
  return {
    name: "hmr-plugin",
    stage: "post-transform",
    apply: "dev",
    transform(fileId, code) {
      if (!code || !fileId.endsWith("component.ts")) return code;
      // Fetches the selector and the class name from the code to add to the mapping.
      // This is used to replace components using HMR.
      const componentSelectorMatch = code.match(/selector:( )?("|')(.*)("|'),/);
      const componentNameMatch = code.match(
        /export class [a-zA-Z]* (extends (.*) )?(implements (.*) )?{/,
      );
      const componentSelectorParts = componentSelectorMatch[0].includes('"')
        ? componentSelectorMatch[0].split('"')
        : componentSelectorMatch[0].split("'");
      const classIndex = componentNameMatch[0].indexOf("class");
      const componentNameParts = componentNameMatch[0].substring(classIndex + 6).split(" ");
      const fullFooter = hmrFooter
        .replace(nameTemplate, componentNameParts[0])
        .replace(selectorTemplate, componentSelectorParts[1]);
      return `${code}${fullFooter}`;
    },
  };
}
/**
 * Plugin for adding an HMR handler to the main.ts file.
 */
export function appBootstrapPlugin() {
  return {
    name: "global-app-plugin",
    stage: "read",
    apply: "dev",
    transform(fileId, code) {
      if (!fileId.includes("main.ts") || !code) return code;
      // The global app variable allows us to update the DOM
      // and the angular app whenever a file changes
      return code.replace(/bootstrapApplication\([a-zA-Z]+, [a-zA-Z]+?\)/, (value) => {
        return `${value}.then((app) => {
          globalThis.__app = app;
        })`;
      });
    },
  };
}
/**
 * Plugin for adding instrumenting files in tests (for coverage).
 */
export function instrumentFiles(config) {
  let filter;
  return {
    name: "instrument-files",
    stage: "read",
    apply: "test",
    setup(_env) {
      filter = createFilter(config.include, config.exclude);
    },
    transform(fileId, code) {
      // Filter out files that don't need to be instrumented
      if (!filter(fileId) || !code) return code;
      const instrumentedRes = transformSync(code, {
        filename: fileId,
        plugins: [
          ["istanbul"],
          ["@babel/plugin-syntax-decorators", { decoratorsBeforeExport: true }],
          ["@babel/plugin-syntax-typescript"],
        ],
        sourceMaps: "inline",
      })?.code;
      return instrumentedRes || undefined;
    },
  };
}
/**
 * Imports the compiler to the code in development. This replaces the
 * angular linker vite plugin in development as it's considerably faster.
 */
export function addCompiler() {
  return {
    name: "add-compiler",
    stage: "post-transform",
    apply: "dev",
    transform(fileId, code) {
      if (!fileId.includes("main.ts") || !code) return code;
      return `import '@angular/compiler';\n${code}`;
    },
  };
}
/**
 * Adds an import for the polyfills file to the main.ts file in the
 * production build.
 */
export function addPolyfills() {
  return {
    name: "add-polyfills",
    stage: "post-transform",
    apply: "production",
    transform(fileId, code) {
      if (!fileId.includes("main.ts") || !code) return code;
      return `import('./polyfills.ts');\n${code}`;
    },
  };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVpbGRlclBsdWdpbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvYnVpbGRlclBsdWdpbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFzQkU7QUFFRixPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQVE1QyxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUM7QUFDbEMsTUFBTSxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztBQUMxQyxNQUFNLFNBQVMsR0FBRzs7Ozs7K0NBSzZCLFlBQVksT0FBTyxnQkFBZ0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBZ0NqRixDQUFDO0FBRUY7OztLQUdLO0FBQ0wsTUFBTSxVQUFVLGFBQWE7SUFDM0IsT0FBTztRQUNMLElBQUksRUFBRSxZQUFZO1FBQ2xCLEtBQUssRUFBRSxnQkFBZ0I7UUFDdkIsS0FBSyxFQUFFLEtBQUs7UUFDWixTQUFTLENBQUMsTUFBYyxFQUFFLElBQXdCO1lBQ2hELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQztnQkFBRSxPQUFPLElBQUksQ0FBQztZQUUzRCwrRUFBK0U7WUFDL0UsZ0RBQWdEO1lBQ2hELE1BQU0sc0JBQXNCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1lBQzFFLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FDbkMsNkRBQTZELENBQzlELENBQUM7WUFDRixNQUFNLHNCQUFzQixHQUFHLHNCQUF1QixDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7Z0JBQ3JFLENBQUMsQ0FBQyxzQkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO2dCQUN2QyxD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
