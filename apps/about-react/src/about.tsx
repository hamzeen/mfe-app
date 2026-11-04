import { useEffect, useState } from "react";
import { EVENTS, subscribe } from "@mfe/utils";

export function About() {
    const [sessionNote, setSessionNote] = useState(
        () => sessionStorage.getItem("mfe-demo-session") ?? "Northstar workspace",
    );
    const [theme, setTheme] = useState(() => document.documentElement.dataset.theme ?? "light");
    const [uptime, setUptime] = useState(0);

    useEffect(() => {
        const disposeSession = subscribe<{ value: string }>(EVENTS.session, ({ value }) =>
            setSessionNote(value),
        );
        const disposeTheme = subscribe<{ theme: string }>(EVENTS.theme, ({ theme }) =>
            setTheme(theme),
        );
        const intervalId = window.setInterval(() => setUptime((value) => value + 1), 1000);
        return () => {
            disposeSession();
            disposeTheme();
            window.clearInterval(intervalId);
        };
    }, []);

    return (
        <main className="about-mfe" data-mfe="about-react" aria-labelledby="about-title">
            <div className="about-kicker">
                <span>02 / ABOUT</span>
                <span className="framework-tag">REACT 18</span>
            </div>
            <div className="about-grid">
                <section>
                    <p className="about-label">INDEPENDENT APPLICATION / RUNTIME FEDERATION</p>
                    <h1 id="about-title">
                        Built to travel
                        <br />
                        <em>on its own.</em>
                    </h1>
                    <p className="about-copy">
                        This React view is fetched only for this route. Publish a new version at a
                        different URL, point the runtime import map at it, and the shell bundle
                        stays untouched.
                    </p>
                </section>
                <aside className="about-runtime" aria-label="React frontend diagnostics">
                    <span className="about-note-index">LIVE / B</span>
                    <strong>Shared workspace</strong>
                    <p className="about-shared-note">{sessionNote}</p>
                    <span className="about-note-rule" />
                    <span className="about-counter">
                        MOUNT UPTIME <b>{uptime}s</b>
                    </span>
                    <span className="about-theme-value">SHELL THEME / {theme}</span>
                </aside>
            </div>
            <div className="about-bottomline">
                <span>REACT COMPONENT</span>
                <span>BOOTSTRAP → MOUNT → UNMOUNT</span>
                <span>ROUTE /ABOUT</span>
            </div>
        </main>
    );
}
