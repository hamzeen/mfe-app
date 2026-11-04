import { useEffect, useState } from "react";
import { EVENTS, emitSessionChanged, emitThemeChanged, subscribe } from "@mfe/utils";
import type { MfeErrorDetail, MfeStateDetail } from "@mfe/contracts";
import { appRoute, navigate, retryActiveFrontend, routeHref } from "./main";

type FrontendState = "loading" | "ready" | "error";

export function Shell() {
    const [path, setPath] = useState(appRoute());
    const [frontendState, setFrontendState] = useState<FrontendState>("loading");
    const [errorApp, setErrorApp] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [theme, setTheme] = useState<"light" | "dark">(() =>
        localStorage.getItem("mfe-theme") === "dark" ? "dark" : "light",
    );
    const [sessionValue, setSessionValue] = useState(
        () => sessionStorage.getItem("mfe-demo-session") ?? "Northstar workspace",
    );
    const [lastFramework, setLastFramework] = useState("Waiting for a frontend");
    const knownRoute = path === "/" || path === "/about" || path.startsWith("/about/");
    const activeApp =
        path === "/" ? "home-angular" : path.startsWith("/about") ? "about-react" : "";

    useEffect(() => {
        const updatePath = () => setPath(appRoute());
        window.addEventListener("single-spa:routing-event", updatePath);
        window.addEventListener("popstate", updatePath);
        const disposeState = subscribe<MfeStateDetail>(EVENTS.state, (detail) => {
            if (detail.app === activeApp || detail.app === "shell") {
                setFrontendState(detail.state);
                setErrorApp(detail.state === "error" ? detail.app : "");
                if (detail.state === "error") {
                    setErrorMessage(
                        (current) => current || detail.message || "Frontend unavailable",
                    );
                } else {
                    setErrorMessage("");
                }
            }
        });
        const disposeError = subscribe<MfeErrorDetail>(EVENTS.error, (detail) => {
            setErrorApp(detail.app);
            setErrorMessage(detail.message);
        });
        const disposeFramework = subscribe<{ framework: string }>(
            EVENTS.frameworkActive,
            (detail) => setLastFramework(detail.framework),
        );
        return () => {
            window.removeEventListener("single-spa:routing-event", updatePath);
            window.removeEventListener("popstate", updatePath);
            disposeState();
            disposeError();
            disposeFramework();
        };
    }, [activeApp]);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem("mfe-theme", theme);
        emitThemeChanged({ theme });
    }, [theme]);

    function changeSession(value: string) {
        setSessionValue(value);
        sessionStorage.setItem("mfe-demo-session", value);
        emitSessionChanged({ value });
    }

    function followRoute(event: React.MouseEvent<HTMLAnchorElement>) {
        event.preventDefault();
        navigate(event.currentTarget.href);
    }

    async function retry() {
        if (errorApp === "shell") {
            window.location.reload();
            return;
        }
        setErrorApp("");
        setErrorMessage("");
        setFrontendState("loading");
        await retryActiveFrontend(activeApp);
    }

    return (
        <div className="shell-frame" data-shell-root="persistent">
            <header className="topbar">
                <a
                    className="wordmark"
                    href={routeHref("/")}
                    onClick={followRoute}
                    aria-label="Fieldnotes runtime lab home">
                    <span className="wordmark-mark" aria-hidden="true">
                        F
                    </span>
                    <span>
                        MICRO FRONTEND <small>RUNTIME LAB</small>
                    </span>
                </a>
                <nav className="primary-nav" aria-label="Primary navigation">
                    <a
                        href={routeHref("/")}
                        onClick={followRoute}
                        aria-current={path === "/" ? "page" : undefined}>
                        Home <span>01</span>
                    </a>
                    <a
                        href={routeHref("/about")}
                        onClick={followRoute}
                        aria-current={path.startsWith("/about") ? "page" : undefined}>
                        About <span>02</span>
                    </a>
                </nav>
                <div className="topbar-tools">
                    <button
                        className="theme-toggle"
                        type="button"
                        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}>
                        <span aria-hidden="true">{theme === "light" ? "◐" : "◑"}</span>
                        <span>{theme === "light" ? "Day" : "Night"}</span>
                    </button>
                </div>
            </header>

            <main className="main-layout">
                <section className="intro-band" aria-labelledby="page-title">
                    <div>
                        <p className="eyebrow">
                            <span className="status-dot" /> CLIENT-SIDE COMPOSITION / 2026
                        </p>
                        <h1 id="page-title">
                            One shell.
                            <br />
                            <em>Two runtimes.</em>
                        </h1>
                    </div>
                    <p className="intro-note">
                        The frame stays steady while each route brings its own framework, lifecycle,
                        and deployment.
                    </p>
                </section>

                <section className="workbench" aria-label="Frontend workspace">
                    <div className="workbench-heading">
                        <div>
                            <span className="section-index">
                                WORKSPACE /{" "}
                                {path === "/" ? "01" : path.startsWith("/about") ? "02" : "--"}
                            </span>
                            <h2>
                                {path === "/"
                                    ? "Home"
                                    : path.startsWith("/about")
                                      ? "About"
                                      : "Route not found"}
                            </h2>
                        </div>
                        <div className={`runtime-pill runtime-${frontendState}`} aria-live="polite">
                            <span className="runtime-indicator" />
                            {knownRoute
                                ? frontendState === "ready"
                                    ? `${lastFramework} active`
                                    : frontendState === "error"
                                      ? "Frontend unavailable"
                                      : "Loading frontend"
                                : "No frontend on this route"}
                        </div>
                    </div>

                    <div className="mfe-stage">
                        <div
                            id="mfe-container"
                            className="mfe-container"
                            data-testid="mfe-container"
                        />
                        {!knownRoute && (
                            <div className="mfe-status-panel unknown-route">
                                <p className="eyebrow">404 / ROUTE</p>
                                <h3>This route has no frontend.</h3>
                                <a href={routeHref("/")} onClick={followRoute}>
                                    Return to Home
                                </a>
                            </div>
                        )}
                        {knownRoute && frontendState === "loading" && (
                            <div className="mfe-status-panel loading-state" role="status">
                                <span className="loading-mark" />
                                Connecting to {activeApp === "home-angular"
                                    ? "Angular"
                                    : "React"}{" "}
                                runtime
                            </div>
                        )}
                        {knownRoute && frontendState === "error" && (
                            <div className="mfe-status-panel error-state" role="alert">
                                <div>
                                    <p className="eyebrow">
                                        REMOTE ERROR / {errorApp || activeApp}
                                    </p>
                                    <h3>The frontend did not arrive.</h3>
                                    <p>
                                        {errorMessage ||
                                            "The shell is still running. Check the bundle URL, CORS headers, or deployment version."}
                                    </p>
                                    <button type="button" onClick={retry}>
                                        Retry frontend
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="session-strip" aria-label="Shared session demonstration">
                    <div className="session-label">
                        <span className="session-mark" aria-hidden="true">
                            ↗
                        </span>
                        <div>
                            <strong>Shared session</strong>
                            <small>shell ⇄ frontend</small>
                        </div>
                    </div>
                    <label className="session-input-label" htmlFor="session-note">
                        Live workspace note
                    </label>
                    <input
                        id="session-note"
                        value={sessionValue}
                        maxLength={64}
                        onChange={(event) => changeSession(event.target.value)}
                    />
                    <span className="session-sync" aria-live="polite">
                        SAVED IN THIS TAB
                    </span>
                </section>
            </main>

            <footer className="system-footer">
                <span>MICRO FRONTEND / 02 APPS</span>
                <span>
                    <i /> Shell mounted once · route changes are client-side
                </span>
                <span>
                    RUNTIME CONFIG / <code>runtime-importmap.json</code>
                </span>
            </footer>
        </div>
    );
}
