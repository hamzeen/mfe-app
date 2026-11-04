import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const basePath = process.env.VITE_BASE_PATH ?? "/";
const baseSegments = basePath.split("/").filter(Boolean);
const normalizedBasePath = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";
const releaseId = (
    process.env.MFE_RELEASE_ID ??
    process.env.GITHUB_SHA?.slice(0, 12) ??
    Date.now().toString(36)
).replace(/[^a-zA-Z0-9._-]/g, "");
const apps = ["home-angular", "about-react"];

for (const app of apps) {
    const outputDirectory = resolve(root, "dist/shell/mfes", releaseId, app);
    await mkdir(outputDirectory, { recursive: true });
    await copyFile(
        resolve(root, `dist/mfes/${app}/entry.js`),
        resolve(outputDirectory, "entry.js"),
    );
    await copyFile(
        resolve(root, `dist/mfes/${app}/entry.js.map`),
        resolve(outputDirectory, "entry.js.map"),
    );
}

const importMap = {
    imports: {
        "@mfe/home-angular": `${normalizedBasePath}mfes/${releaseId}/home-angular/entry.js?v=${releaseId}`,
        "@mfe/about-react": `${normalizedBasePath}mfes/${releaseId}/about-react/entry.js?v=${releaseId}`,
    },
};
await writeFile(
    resolve(root, "dist/shell/runtime-importmap.json"),
    `${JSON.stringify(importMap, null, 2)}\n`,
);

const shellHtmlPath = resolve(root, "dist/shell/index.html");
const shellHtml = await readFile(shellHtmlPath, "utf8");
await writeFile(
    shellHtmlPath,
    shellHtml.replace(
        "</head>",
        `    <link rel="preconnect" href="${normalizedBasePath}mfes" />\n  </head>`,
    ),
);
const fallbackPath = resolve(root, "dist/shell/404.html");
const fallbackHtml = await readFile(fallbackPath, "utf8");
await writeFile(fallbackPath, fallbackHtml.replace("__MFE_BASE_PATH__", normalizedBasePath));
console.log(`Staged release ${releaseId}; runtime map points to versioned remote bundles.`);
