import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    root: resolve(import.meta.dirname),
    esbuild: { jsx: "automatic", jsxImportSource: "react" },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    build: {
        target: "es2022",
        outDir: "../../dist/mfes/about-react",
        emptyOutDir: true,
        sourcemap: true,
        lib: {
            entry: resolve(import.meta.dirname, "src/single-spa.tsx"),
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
