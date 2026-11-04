import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const basePath = process.env.VITE_BASE_PATH ?? "/";
const baseSegments = basePath.split("/").filter(Boolean);
const normalizedBasePath = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";
const [app, requestedReleaseId] = process.argv.slice(2);
const remoteName = app === "home-angular" || app === "about-react" ? `@mfe/${app}` : "";

if (!remoteName) throw new Error("Usage: npm run publish:remote -- home-angular|about-react");

const releaseId = (
    requestedReleaseId ??
    process.env.MFE_RELEASE_ID ??
    Date.now().toString(36)
).replace(/[^a-zA-Z0-9._-]/g, "");
const shellDirectory = resolve(root, "dist/shell");
const sourceDirectory = resolve(root, `dist/mfes/${app}`);
const versionedDirectory = resolve(shellDirectory, "mfes", releaseId, app);
const importMapPath = resolve(shellDirectory, "runtime-importmap.json");

await mkdir(versionedDirectory, { recursive: true });
await copyFile(resolve(sourceDirectory, "entry.js"), resolve(versionedDirectory, "entry.js"));
await copyFile(
    resolve(sourceDirectory, "entry.js.map"),
    resolve(versionedDirectory, "entry.js.map"),
);

const importMap = JSON.parse(await readFile(importMapPath, "utf8"));
importMap.imports[remoteName] =
    `${normalizedBasePath}mfes/${releaseId}/${app}/entry.js?v=${releaseId}`;
await writeFile(importMapPath, `${JSON.stringify(importMap, null, 2)}\n`);
console.log(`Published ${app} as ${releaseId}; only runtime-importmap.json changed for the shell.`);
