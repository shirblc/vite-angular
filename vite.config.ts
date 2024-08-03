import { defineConfig } from "vite";
import { BuildAngularPlugin, AngularLinkerPlugin, GlobalStylesPlugin } from "./plugins";
import * as path from "path";

export default defineConfig({
  plugins: [
    AngularLinkerPlugin(),
    BuildAngularPlugin(),
    GlobalStylesPlugin("src/styles", "main.less"),
  ],
  css: {
    preprocessorOptions: {
      less: {
        additionalData: `@import "./src/styles/main.less"`,
      },
    },
  },
  server: {
    watch: {
      ignored: ["**/coverage/**",]
    }
  },
  optimizeDeps: {
    exclude: ["/__web-dev-server__web-socket.js", "@web/test-runner-core"]
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("polyfill.js") || id.includes("zone.js")) {
            return "polyfills";
          } else if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@app": path.resolve(__dirname, "./src/app"),
    },
  },
});
