import { access, cp, copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
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
const outputReleases = resolve(root, "dist/shell/mfes");
const archiveReleases = process.env.REMOTE_ARCHIVE_DIR;
const allowEmptyArchive = process.env.REMOTE_ARCHIVE_INITIALIZED === "false";

if (archiveReleases) {
    let archivedEntries;
    try {
        archivedEntries = await readdir(archiveReleases, { withFileTypes: true });
    } catch (error) {
        if (error?.code !== "ENOENT" || !allowEmptyArchive) {
            throw new Error(`Could not restore remote archive at ${archiveReleases}`, {
                cause: error,
            });
        }
        archivedEntries = [];
    }

    if (!archivedEntries.length && !allowEmptyArchive) {
        throw new Error(
            `Remote archive at ${archiveReleases} is empty; refusing to publish without retained releases.`,
        );
    }

    await mkdir(outputReleases, { recursive: true });
    for (const entry of archivedEntries) {
        if (!entry.isDirectory()) {
            throw new Error(`Invalid entry in remote archive: ${entry.name}`);
        }
        const archivedRelease = resolve(archiveReleases, entry.name);
        const archivedApps = await readdir(archivedRelease, { withFileTypes: true });
        let validatedApps = 0;
        for (const app of apps) {
            const appDirectory = archivedApps.find((candidate) => candidate.name === app);
            if (!appDirectory) continue;
            if (!appDirectory.isDirectory()) {
                throw new Error(`Invalid archived frontend directory: ${entry.name}/${app}`);
            }
            await access(resolve(archivedRelease, app, "entry.js"));
            await access(resolve(archivedRelease, app, "entry.js.map"));
            validatedApps += 1;
        }
        if (
            validatedApps === 0 ||
            archivedApps.some((candidate) => !apps.includes(candidate.name))
        ) {
            throw new Error(`Invalid remote release archive directory: ${entry.name}`);
        }
        await cp(archivedRelease, resolve(outputReleases, entry.name), {
            recursive: true,
            force: false,
            errorOnExist: false,
        });
    }
    console.log(`Restored ${archivedEntries.length} archived remote release directories.`);
}

for (const app of apps) {
    const outputDirectory = resolve(outputReleases, releaseId, app);
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
