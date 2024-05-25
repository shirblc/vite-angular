import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import { ReplaceTemplateUrlPlugin, TranspileDecoratorsVite } from "./plugins";

export default defineConfig({
  plugins: [
    ReplaceTemplateUrlPlugin(),
    TranspileDecoratorsVite()
  ],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "./src/styles/main.less"`,
      },
    }
  },
  build: {
    sourcemap: true,
    rollupOptions: {
       plugins: [
        typescript({ tsconfig: "./tsconfig.json", exclude: ["**/*.spec.ts", "e2e/**/*"] }),
      ]
    }
  }
});