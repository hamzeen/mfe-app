import { expect, test } from "@playwright/test";

const production = process.env.MFE_PRODUCTION === "1";
const basePath = process.env.VITE_BASE_PATH ?? "/";
const routeUrl = (route: string) => `${basePath}${route.replace(/^\/+/, "")}`;
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("Home and About switch without remounting the shell and share session state", async ({
    page,
}) => {
    await page.goto(routeUrl("/"));
    await expect(page.locator('[data-mfe="home-angular"]')).toBeVisible();
    await page.evaluate(() => {
        (window as Window & { shellIdentity?: Element | null }).shellIdentity =
            document.querySelector("[data-shell-root]");
    });

    await page.getByLabel("Live workspace note").fill("release candidate 42");
    await expect(page.locator(".shared-note")).toHaveText("release candidate 42");
    await page.getByRole("link", { name: /About/ }).click();
    await expect(page).toHaveURL(new RegExp(`${escapeRegex(routeUrl("/about"))}$`));
    await expect(page.locator('[data-mfe="about-react"]')).toBeVisible();
    await expect(page.locator(".about-shared-note")).toHaveText("release candidate 42");
    await expect(page.locator("[data-mfe]")).toHaveCount(1);
    expect(
        await page.evaluate(
            () =>
                (window as Window & { shellIdentity?: Element | null }).shellIdentity ===
                document.querySelector("[data-shell-root]"),
        ),
    ).toBe(true);
    expect(await page.evaluate(() => performance.getEntriesByType("navigation").length)).toBe(1);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${escapeRegex(routeUrl("/"))}$`));
    await expect(page.locator('[data-mfe="home-angular"]')).toBeVisible();
    await page.goForward();
    await expect(page.locator('[data-mfe="about-react"]')).toBeVisible();
});

test("direct access, refresh, unknown routes, and repeated switching keep one active app", async ({
    page,
}) => {
    await page.goto(routeUrl("/about"));
    await expect(page.locator('[data-mfe="about-react"]')).toBeVisible();
    await page.reload();
    await expect(page.locator('[data-mfe="about-react"]')).toBeVisible();

    for (let turn = 0; turn < 6; turn += 1) {
        await page.getByRole("link", { name: /Home/ }).click();
        await expect(page.locator('[data-mfe="home-angular"]')).toBeVisible();
        await expect(page.locator("[data-mfe]")).toHaveCount(1);
        await page.getByRole("link", { name: /About/ }).click();
        await expect(page.locator('[data-mfe="about-react"]')).toBeVisible();
        await expect(page.locator("[data-mfe]")).toHaveCount(1);
    }

    await page.goto(routeUrl("/missing"));
    await expect(page.getByRole("heading", { name: "This route has no frontend." })).toBeVisible();
    await expect(page.locator("[data-mfe]")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
});

test("a failed remote leaves navigation usable and retries cleanly", async ({ page }) => {
    test.skip(production, "The production static preview uses the already-staged bundles.");
    const remoteRequests: string[] = [];
    await page.route("**/src/single-spa.tsx*", async (route) => {
        remoteRequests.push(route.request().url());
        if (remoteRequests.length === 1) {
            await route.fulfill({ status: 503, body: "Unavailable" });
        } else {
            await route.continue();
        }
    });
    await page.goto(routeUrl("/"));
    await expect(page.locator('[data-mfe="home-angular"]')).toBeVisible();
    await page.getByRole("link", { name: /About/ }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
    await page.getByRole("button", { name: "Retry frontend" }).click();
    await expect(page.locator('[data-mfe="about-react"]')).toBeVisible();
    expect(remoteRequests).toHaveLength(2);
    expect(remoteRequests[1]).toContain("mfe-retry=1");
});
