import { defineConfig } from "vite";
import { BuildAngularPlugin } from "./plugins";
import { babel } from "@rollup/plugin-babel";
import defaultLinkerPlugin from "@angular/compiler-cli/linker/babel";
import * as path from "path";

export default defineConfig({
  plugins: [BuildAngularPlugin()],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "./src/styles/main.less"`,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      plugins: [babel({ plugins: [defaultLinkerPlugin], babelHelpers: "bundled" })],
    },
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
    },
  },
});
