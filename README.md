# Fieldnotes Runtime Lab

A client-side micro frontend demo with a persistent React shell, an Angular Home frontend at `/`, and a React About frontend at `/about`. Single-SPA owns activation and lifecycle; the shell remains mounted as navigation changes.

## Run locally

```sh
npm install
npm run dev
```

Open `http://localhost:5173`. Vite serves the shell on port 5173, Angular on 4174, and React on 4175. The shell reads `apps/shell/public/runtime-importmap.json` at startup; local entries point to each framework's Vite dev server.

## Runtime loading

Production frontends are independent single-file ESM bundles at `dist/mfes/<app>/entry.js`. The shell fetches `/runtime-importmap.json`, installs the map before Single-SPA requests a remote, and uses native `import()` for the named specifier. No frontend source is imported into or bundled with the shell. Shared packages are compiled into each remote at its own build time.

Build and stage all three applications with `npm run build`. This writes separate framework bundles and a shell distribution under `dist/shell`. The staging script copies each remote into a release-specific URL and updates only the runtime JSON file. The shell JavaScript does not contain remote URLs.

For a frontend-only release, build just that workspace, upload its `entry.js` to a new versioned directory on a static host, then update the matching URL in the separately served `runtime-importmap.json`. For example:

```sh
npm run build --workspace @mfe/about-react
npm run publish:remote -- about-react release-42
```

The command copies the new bundle under `dist/shell/mfes/release-42/about-react/`, then updates only `dist/shell/runtime-importmap.json`. Upload the new remote directory and that JSON file to their static hosts; no shell rebuild is involved. Keep old versioned bundle URLs available during the rollout; rollback is changing the import-map URL back to the prior release. The import-map response uses `cache: no-store`; remote URLs include a release query and should use immutable caching when they are versioned. Do not overwrite a versioned URL.

The Pages workflow stores immutable bundles on the `mfe-releases` branch. Before each clean build it restores that archive into the Pages artifact, stages the new bundles, publishes the archive branch first, then deploys the site with the updated runtime import map. Existing clients holding an older map can still fetch their version after a deployment; rollback can point the map to a retained release. Only an explicitly detected missing branch permits first-run initialization. Fetch, authentication, missing-directory, empty-archive, or incomplete-release errors fail the workflow before site publication.

## Independent origins and assets

Vite's development and preview servers enable CORS. For a separately hosted production remote, serve JavaScript with a JavaScript content type and `Access-Control-Allow-Origin` for the shell origin (or `*` for public, credential-free bundles). Native ESM imports enforce CORS. The current remotes inline their small styles and have no external asset dependencies; for future assets, use URLs rooted at the remote origin (for example `new URL('./image.webp', import.meta.url)`) rather than shell-relative paths. Publish those files alongside the remote and apply the same CORS policy.

## Verify

```sh
npm run typecheck
npm run test:e2e
npm run test:production
```

The Playwright checks cover route rendering, direct load and refresh, browser back/forward, stable shell identity, one active MFE, six repeated route cycles, unknown paths, session propagation, load failure, and the staged production ESM bundles. `npm run test:production` builds then serves all outputs through the production shell preview.

## Deployment

`.github/workflows/deploy.yml` builds and verifies the app, then deploys `dist/shell` to GitHub Pages on pushes to `main`. It builds for the project-site base path `/mfe-app/`, so the app can live at `https://hamzeen.github.io/mfe-app/` alongside a portfolio served from the domain root. Enable GitHub Pages with **GitHub Actions** as the source. The workflow output includes the deployed page URL. Shell assets, navigation, runtime import-map entries, versioned remote URLs, and the 404 deep-link fallback all use the same base path. Local development defaults to `/`; for another Pages project name, update `VITE_BASE_PATH` in the workflow.

For production split hosting, publish shell and each remote to static origins independently and set import-map values to absolute HTTPS URLs. Remote origins need the CORS headers above. Deploy the changed import-map JSON as runtime configuration without rebuilding shell JavaScript.

## Shared session and bounded verification

The shell persists a tab-scoped workspace note in `sessionStorage` and broadcasts `shell:session-changed`; both frontends render it and unsubscribe on unmount. Theme state is shell-owned, stored in `localStorage`, and broadcast through `shell:theme-changed`. The verification loop is intentionally bounded to six Home/About round trips plus one direct-route, history, failure, and production pass; CI retries a failed job once, rather than retrying an application loop indefinitely.

Each MFE exports `bootstrap`, `mount`, and `unmount`. React tears down its root, event subscription, interval, and injected styles. Its `ready` event is emitted from an effect after commit; a React error boundary reports asynchronous render errors to the shell, which keeps navigation available. Angular destroys its component/application; the component clears its subscription and interval.
