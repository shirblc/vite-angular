import { defineConfig } from "vite";
import typescript from "@rollup/plugin-typescript";
import { ReplaceTemplateUrlPlugin, SetProductionEnvPlugin, TranspileDecoratorsVite } from "./plugins";

export default defineConfig(({ mode }) => ({
  plugins: [
    ReplaceTemplateUrlPlugin(),
    SetProductionEnvPlugin(mode),
    TranspileDecoratorsVite()
  ],
  css: {
    preprocessorOptions: {
      sass: {
        additionalData: `@import "./src/sass/main.sass"`,
      },
    }
  },
  optimizeDeps: {
    include: ['@angular/compiler']
  },
  build: {
    sourcemap: true,
    rollupOptions: {
       plugins: [
        typescript({ tsconfig: "./tsconfig.json", exclude: ["**/*.spec.ts", "e2e/**/*"] }),
      ]
    }
  }
}));