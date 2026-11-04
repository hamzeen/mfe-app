import { resolve } from "node:path";
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";

export default defineConfig({
    root: resolve(import.meta.dirname),
    plugins: [angular({ tsconfig: resolve(import.meta.dirname, "tsconfig.app.json") })],
    resolve: { mainFields: ["module"] },
    build: {
        target: "es2022",
        outDir: "../../dist/mfes/home-angular",
        emptyOutDir: true,
        sourcemap: true,
        lib: {
            entry: resolve(import.meta.dirname, "src/single-spa.ts"),
            formats: ["es"],
            fileName: () => "entry.js",
        },
        rollupOptions: {
            output: { inlineDynamicImports: true },
        },
        assetsInlineLimit: 10000000,
    },
    server: { cors: true },
    preview: { cors: true },
});
