# Vite-Angular

An Angular template using Vite for development and build.

Comes with LESS as a CSS pre-processor and prettier for code formatting.

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
11. **reflect-metadata** - Contains an implementation of the reflect-metadata proposal (for decorators). Installed as one of Angular's dependencies. For more information, check the [reflect-metadata repository](https://github.com/rbuckton/reflect-metadata).

For more information about Angular's required NPM packages, check the [Angular docs](https://angular.dev/reference/configs/npm-packages).

## Everything else

1. **Vite** - Vite is a fast, feature-rich front-end development environment, which handles everything from development to deployment. In this app, it's used to power up the development server, handle the environment variables and build the app for production. For more information, view the [Vite documentation](https://vitejs.dev/).
2. **TypeScript** - TypeScript is a superset of JavaScript, with added features and updated syntax (including, but not limited to, typing). It's the language the app is built in (before Vite compiles it back to JavaScript). For more information, view the [TypeScript docuemntation](https://www.typescriptlang.org/).
3. **@rollup/plugin-typescript** - Rollup's TypeScript plugin. Used to compile the decorators Angular uses while maintaining metadata. For more information, view the [plugin's NPM page](https://www.npmjs.com/package/@rollup/plugin-typescript).
4. **magic-string** - A helper for making modifications to text and generating source maps to track those modifications. For more information, check the [magic-string repository](https://github.com/rich-harris/magic-string).
5. **Less** - Less is used as the CSS pre-processor for the app. For more information, view the [LESS documentation](https://lesscss.org).

### Testing Dependencies

This project's tests are run using the Jasmine framework and the Karma runner. Thus, testing requires several packages:

1. **Jasmine** - An open-source behaviour-driven testing framework. For more information, check Jasmine's [official site](https://jasmine.github.io). Included packages:
   - **jasmine-core**
   - **jasmine-spec-reporter**
   - **@types/jasmine** - A typed version, required in order to write TypeScript tests.
2. **Karma** - An open-source test-runner, used to run the tests on various devices with a test server. For more information, check Karma's [official site](https://karma-runner.github.io/latest/index.html). Included packages:
   - **karma**
   - **karma-jasmine** - A Karma adapter for the Jasmine framework. [Project repo.](https://github.com/karma-runner/karma-jasmine)
   - **karma-jasmine-html-reporter** - A reporter that shows test results in HTML. [NPM page.](https://www.npmjs.com/package/karma-jasmine-html-reporter).
   - **karma-chrome-launcher** - A launcher for Chrome, Chrome Canary and Chromuim. [Project repo.](https://github.com/karma-runner/karma-chrome-launcher).
   - **karma-coverage** - Code coverage generator. [Project repo.](https://github.com/karma-runner/karma-coverage)
   - **karma-coverage-istanbul-reporter** - Code coverage generator reporter. [NPM page.](https://www.npmjs.com/package/karma-coverage-istanbul-reporter)
   - **karma-sourcemap-loader** - A preprocessor that loads existing source maps. [NPM page.](https://www.npmjs.com/package/karma-sourcemap-loader)
   - **karma-rollup-preprocessor** - A rollup preprocessor for karma, used to bundle up the tests. [NPM page.](https://www.npmjs.com/package/karma-rollup-preprocessor)
3. **Cypress** - An open-source test runner, used primarily for e2e and integration tests. For more information, check their [official documentation](https://docs.cypress.io).

## Testing

### Writing Tests

Tests are written in TypeScript and each component's tests are located in the same directory as the component. Test files' names follow this format: `<component_name>.spec.ts`. This format is the way tests are picked up by the main testing file, and so it's important to keep to it.

End-to-end tests are also written in TypeScript. All end-to-end tests are located in [e2e/src](./e2e/src), and are named in a similar manner to regular specs files: `<something_to_test>.spec.ts`. The Cypress config is in the root (in `cypress.json`), but the plugins and support files are in the [e2e](./e2e) folder as well.

### Running Tests

Running tests is done through the dedicated Gulp task. All you need to do is run `gulp test` in the terminal; this will start Karma and trigger Rollup's compilation of tests and project files.

Running end-to-end tests is done through an npm script. Running `npm run e2e` in the terminal will bundle up assets for testing, fire up the development server and run Cypress.

## Known Issues

1. Chunking doesn't currently work in production.
2. Not inlining the templates doesn't currently work either.
3. Missing tests!
