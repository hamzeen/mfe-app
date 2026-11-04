import { defineConfig, devices } from "@playwright/test";

const production = process.env.MFE_PRODUCTION === "1";
const basePath = process.env.VITE_BASE_PATH ?? "/";
const testBaseUrl = production ? `http://127.0.0.1:5180${basePath}` : "http://127.0.0.1:5173";

export default defineConfig({
    testDir: "./tests",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: "list",
    use: {
        baseURL: testBaseUrl,
        trace: "retain-on-failure",
        ...devices["Desktop Chrome"],
    },
    webServer: {
        command: production ? "npm run preview:production" : "npm run dev",
        url: testBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
    },
});
