import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
    root: resolve(import.meta.dirname),
    base: process.env.VITE_BASE_PATH ?? "/",
    publicDir: "public",
    build: {
        outDir: "../../dist/shell",
        emptyOutDir: true,
        sourcemap: true,
    },
    server: {
        cors: true,
    },
    preview: {
        cors: true,
    },
});
