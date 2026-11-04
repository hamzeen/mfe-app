import { createRoot } from "react-dom/client";
import {
    addErrorHandler,
    navigateToUrl,
    registerApplication,
    start,
    triggerAppChange,
    unloadApplication,
} from "single-spa";
import type { MfeLifecycleModule, RuntimeImportMap } from "@mfe/contracts";
import { emitMfeError, emitMfeState } from "@mfe/utils";
import "@mfe/tokens/tokens.css";
import { Shell } from "./shell";
import "./shell.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Shell root element is missing");

let runtimeImportMap: RuntimeImportMap | null = null;
const basePath = import.meta.env.BASE_URL;

export function appRoute(pathname = window.location.pathname): string {
    if (basePath === "/") return pathname;
    const baseWithoutSlash = basePath.slice(0, -1);
    if (pathname === basePath || pathname === baseWithoutSlash) return "/";
    return pathname.startsWith(basePath) ? `/${pathname.slice(basePath.length)}` : pathname;
}

export function routeHref(route: string): string {
    return `${basePath}${route.replace(/^\/+/, "")}`;
}

createRoot(rootElement).render(<Shell />);

async function installImportMap(): Promise<void> {
    const response = await fetch(`${import.meta.env.BASE_URL}runtime-importmap.json`, {
        cache: "no-store",
    });
    if (!response.ok) throw new Error(`Runtime import map request failed (${response.status})`);
    const importMap = (await response.json()) as RuntimeImportMap;
    for (const [name, url] of Object.entries(importMap.imports)) {
        const resolvedUrl = new URL(url, window.location.href);
        if (resolvedUrl.protocol !== "http:" && resolvedUrl.protocol !== "https:") {
            throw new Error(`Invalid runtime URL for ${name}`);
        }
    }
    runtimeImportMap = importMap;

    const script = document.createElement("script");
    script.type = "importmap";
    script.textContent = JSON.stringify(importMap);
    document.head.append(script);
}

function remoteLoader(name: string, app: string) {
    let attempt = 0;
    return async (): Promise<MfeLifecycleModule> => {
        emitMfeState({ app, state: "loading", message: "Fetching the remote module" });
        try {
            const remoteUrl = runtimeImportMap?.imports[name as keyof RuntimeImportMap["imports"]];
            if (!remoteUrl) throw new Error(`Missing runtime URL for ${name}`);
            let specifier = name;
            if (attempt > 0) {
                const retryUrl = new URL(remoteUrl, window.location.href);
                retryUrl.searchParams.set("mfe-retry", String(attempt));
                specifier = retryUrl.href;
            }
            attempt += 1;
            const module = (await import(/* @vite-ignore */ specifier)) as MfeLifecycleModule;
            return module;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Remote module could not be loaded";
            emitMfeError({ app, message });
            emitMfeState({ app, state: "error", message: "The remote module could not be loaded" });
            throw error;
        }
    };
}

async function startApplications(): Promise<void> {
    try {
        await installImportMap();
        registerApplication({
            name: "home-angular",
            app: remoteLoader("@mfe/home-angular", "home-angular"),
            activeWhen: (location) => appRoute(location.pathname) === "/",
            customProps: {
                domElementGetter: () => document.getElementById("mfe-container") as HTMLElement,
            },
        });
        registerApplication({
            name: "about-react",
            app: remoteLoader("@mfe/about-react", "about-react"),
            activeWhen: (location) => {
                const route = appRoute(location.pathname);
                return route === "/about" || route.startsWith("/about/");
            },
            customProps: {
                domElementGetter: () => document.getElementById("mfe-container") as HTMLElement,
            },
        });
        addErrorHandler((error) => {
            const app = error.appOrParcelName ?? "unknown";
            emitMfeError({ app, message: error.message });
            emitMfeState({ app, state: "error", message: "This frontend failed to start" });
        });
        start({ urlRerouteOnly: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Shell startup failed";
        emitMfeError({ app: "shell", message });
        emitMfeState({
            app: "shell",
            state: "error",
            message: "Runtime configuration could not be loaded",
        });
    }
}

export async function retryActiveFrontend(app: string): Promise<void> {
    if (app !== "home-angular" && app !== "about-react") return;
    emitMfeState({ app, state: "loading", message: "Retrying remote module" });
    try {
        await unloadApplication(app);
        await triggerAppChange();
    } catch (error) {
        const message = error instanceof Error ? error.message : "Frontend retry failed";
        emitMfeError({ app, message });
        emitMfeState({ app, state: "error", message: "Retry did not complete" });
    }
}

export function navigate(path: string): void {
    navigateToUrl(path);
}

void startApplications();
