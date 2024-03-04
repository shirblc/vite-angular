import { defineConfig } from "vite";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import nodeResolve from "@rollup/plugin-node-resolve";
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
    rollupOptions: {
       plugins: [
        typescript({ tsconfig: "./tsconfig.json", exclude: ["**/*.spec.ts", "e2e/**/*"] }),
        nodeResolve({
          extensions: ['.js', '.ts']
        }),
        commonjs({
          extensions: ['.js', '.ts'],
          transformMixedEsModules: true
        }),
      ]
    }
  }
}));