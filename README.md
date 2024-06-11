# Vite-Angular

[![CircleCI](https://circleci.com/gh/shirblc/vite-angular.svg?style=shield)](https://circleci.com/gh/shirblc/vite-angular.svg)
[![codecov](https://codecov.io/gh/shirblc/vite-angular/graph/badge.svg)](https://codecov.io/gh/shirblc/vite-angular)
[![Known Vulnerabilities](https://snyk.io/test/github/shirblc/vite-angular/badge.svg)](https://snyk.io/test/github/shirblc/vite-angular)
[![Depfu](https://badges.depfu.com/badges/e20a0ba27793d4f06dda512f7cec415a/overview.svg)](https://depfu.com/github/shirblc/vite-angular?project_id=40212)
[![Depfu](https://badges.depfu.com/badges/e20a0ba27793d4f06dda512f7cec415a/count.svg)](https://depfu.com/github/shirblc/vite-angular?project_id=40212)

An Angular template using Vite for development and build.

Comes with LESS as a CSS pre-processor, prettier for code formatting, web-test-runner and Jasmine for unit tests, and Cypress for e2e tests.

## Version

Version 0.

Built from the [angular-gulp](https://github.com/shirblc/angular-gulp) repo.

## Requirements

- Node.js

## Installation and Usage

### Developers

1. Download or clone the repo.
2. cd into the project directory.
3. Run `npm install` to install dependencies.
4. Run `npm run dev` to compile for the files for local development.
5. Open localhost:5173.

## Contents

### Components

**Located in:** [src/app/components](./src/app/components)

1. **Sample component** - A sample component meant as an example. Feel free to delete.
2. **Error page** - A sample error page, to which the user is redirected whenever the route doesn't match an existing route (already configured in the routing module). Feel free to configure according to your needs.

### Services

**Located in:** [src/app/services](./src/app/services)

1. **Sample service** - Provided in the app root. A sample service meant as an example. Feel free to delete.

## Dependencies

### Angular

1. **@angular/animations** - Angular's animations library.
2. **@angular/common** - Angular's commonly needed services, pipes and directives.
3. **@angular/compiler** - Angular's template compiler.
4. **@angular/compiler-cli** - Command-line interface to invoke Angular's compiler.
5. **@angular/core** - Critical runtime parts of the Angular framework.
6. **@angular/forms** - Support for template-driven and reactive forms.
7. **@angular/platform-browser** - Everything DOM and browser-related.
8. **@angular/platform-browser-dynamic** - Providers and methods for compiling and running the app.
9. **@angular/router** - Angular's router module.
10. **rxjs** - Contains an implementation of observables, which many Angular APIs use. For more information, check the [rxjs website](https://rxjs.dev).
11. **zone.js** - Implementation of zones for JavaScript (used by Angular).

For more information about Angular's required NPM packages, check the [Angular docs](https://angular.dev/reference/configs/npm-packages).

## Everything else

1. **Vite** - Vite is a fast, feature-rich front-end development environment, which handles everything from development to deployment. In this app, it's used to power up the development server, handle the environment variables and build the app for production. For more information, view the [Vite documentation](https://vitejs.dev/).
2. **TypeScript** - TypeScript is a superset of JavaScript, with added features and updated syntax (including, but not limited to, typing). It's the language the app is built in (before Vite compiles it back to JavaScript). For more information, view the [TypeScript docuemntation](https://www.typescriptlang.org/).
3. **@rollup/plugin-babel** and **@babel/core** - Rollup's Babel plugin. Used to run the [Angular Linker plugin](https://angular.dev/tools/libraries/creating-libraries#consuming-partial-ivy-code-outside-the-angular-cli) to compile the app AOT. For more information, view the [plugin's NPM page](https://www.npmjs.com/package/@rollup/plugin-babel) and [Babel's docs](https://babeljs.io).
4. **magic-string** - A helper for making modifications to text and generating source maps to track those modifications. For more information, check the [magic-string repository](https://github.com/rich-harris/magic-string).
5. **Less** - Less is used as the CSS pre-processor for the app. For more information, view the [LESS documentation](https://lesscss.org).

### Testing Dependencies

This project's tests are run using the Jasmine framework and the Karma runner. Thus, testing requires several packages:

1. **Jasmine** - An open-source behaviour-driven testing framework. For more information, check Jasmine's [official site](https://jasmine.github.io). Included packages:
   - **jasmine-core**
   - **jasmine-spec-reporter**
   - **@types/jasmine** - A typed version, required in order to write TypeScript tests.
2. **Web Test Runner** - An open-source test-runner, used to run the tests on various devices with a test server. For more information, check web-test-runner's [official site](https://modern-web.dev/docs/test-runner/overview/). Included packages:
   - **@web/test-runner**
   - **@web/dev-server-esbuild** - An esbuild plugin for web-test-runner's dev server. Used for test compilation.
   - **@web/dev-server-rollup** - A rollup plugin for web-test-runner's dev server. Used for test compilation.
   - **@web/test-runner-playwright** - A test runner using playwright. Used to run the tests in the browser.
   - **rollup-plugin-tsconfig-paths** - A rollup plugin for resolving tsconfig paths. For more information, check the plugin's [npm page](https://www.npmjs.com/package/rollup-plugin-tsconfig-paths).
   - **web-test-runner-jasmine** - A web-test-runner plugin for using Jasmine as the testing framework. For more information, check the [plugin's repository](https://github.com/blueprintui/web-test-runner-jasmine).
3. **Cypress** - An open-source test runner, used primarily for e2e and integration tests. For more information, check their [official documentation](https://docs.cypress.io).

## Testing

### Writing Tests

Tests are written in TypeScript and each component's tests are located in the same directory as the component. Test files' names follow this format: `<component_name>.spec.ts`. This format is the way tests are picked up by the test runner. (Alternatively, if you wish to use another format, you can update the `files` pattern in `web-test-runner.config.mjs`.)

End-to-end tests are also written in TypeScript. All end-to-end tests are located in [e2e/src](./e2e/src), and are named in a similar manner to regular specs files: `<something_to_test>.spec.ts`. The Cypress config is in the root (in `cypress.json`), but the plugins and support files are in the [e2e](./e2e) folder as well.

### Running Tests

Running tests is done through the dedicated npm script. All you need to do is run `npm test` in the terminal; this will start Web Test Runner's testing process.

Running end-to-end tests is done through an npm script. Running `npm run cypress` in the terminal will run Cypress (make sure the Vite dev server is already running before you do that).

## Known Issues

1. In certain circumstances, if the final test run fails, test execution hangs. (Needs further investigation)
2. The Vite dev server doesn't refresh the compiled JS properly when changes are made to the HTML.
   - The workaround for now is to save any of the TypeScript files; that kicks compilation off immediately
3. The Angular Linker Vite plugin doesn't work at the moment. Getting it to work will allow removing the Angular compiler import in dev mode and replacing the Rollup Babel plugin in prod.
