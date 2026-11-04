import { Component, OnDestroy, OnInit } from "@angular/core";
import { EVENTS, subscribe } from "@mfe/utils";

@Component({
    selector: "mfe-home-angular",
    standalone: true,
    template: `
        <main class="mfe-content" aria-labelledby="home-title">
            <div class="content-kicker">
                <span>01 / HOME</span><span class="framework-tag">ANGULAR 20</span>
            </div>
            <div class="content-grid">
                <section>
                    <p class="content-label">INDEPENDENT APPLICATION / STANDALONE DEPLOYMENT</p>
                    <h1 id="home-title">A front door,<br /><em>not a monolith.</em></h1>
                    <p class="content-copy">
                        This view is an Angular application mounted into a shell-owned element. Its
                        compiled runtime arrives from a separate URL and leaves cleanly when the
                        route changes.
                    </p>
                </section>
                <aside class="runtime-note" aria-label="Angular frontend diagnostics">
                    <span class="note-index">LIVE / A</span>
                    <strong>Shared workspace</strong>
                    <p class="shared-note">{{ sessionNote }}</p>
                    <span class="note-rule"></span>
                    <span class="runtime-counter"
                        >MOUNT UPTIME <b>{{ uptime }}s</b></span
                    >
                    <span class="theme-value">SHELL THEME / {{ theme }}</span>
                </aside>
            </div>
            <div class="home-bottomline">
                <span>ANGULAR COMPONENT</span><span>BOOTSTRAP → MOUNT → UNMOUNT</span
                ><span>ROUTE /</span>
            </div>
        </main>
    `,
    styles: [
        `
            :host {
                display: block;
            }
            .mfe-content {
                min-height: 270px;
                padding: 24px 26px 19px;
                color: var(--ink);
            }
            .content-kicker,
            .home-bottomline {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                color: var(--muted);
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 1px;
            }
            .framework-tag {
                color: var(--brand);
            }
            .content-grid {
                display: grid;
                grid-template-columns: minmax(0, 1fr) 205px;
                align-items: center;
                gap: 34px;
                padding: 27px 0 25px;
            }
            .content-label {
                margin: 0;
                color: var(--muted);
                font-size: 9px;
                font-weight: 800;
                letter-spacing: 1.1px;
            }
            h1 {
                margin: 11px 0 12px;
                font-family: Georgia, "Times New Roman", serif;
                font-size: clamp(28px, 4vw, 42px);
                font-weight: 400;
                line-height: 1;
            }
            h1 em {
                color: var(--brand);
                font-weight: 400;
            }
            .content-copy {
                max-width: 480px;
                margin: 0;
                color: var(--muted);
                font-size: 12px;
                line-height: 1.7;
            }
            .runtime-note {
                min-height: 132px;
                padding: 14px;
                border-left: 2px solid var(--accent);
                background: var(--surface-quiet);
            }
            .note-index,
            .runtime-counter {
                display: block;
                color: var(--muted);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 1px;
            }
            .runtime-note strong {
                display: block;
                margin-top: 12px;
                font-family: Georgia, "Times New Roman", serif;
                font-size: 17px;
                font-weight: 400;
            }
            .shared-note {
                overflow-wrap: anywhere;
                min-height: 16px;
                margin: 4px 0 11px;
                color: var(--brand);
                font-size: 11px;
            }
            .note-rule {
                display: block;
                height: 1px;
                margin-bottom: 9px;
                background: var(--line);
            }
            .runtime-counter b {
                float: right;
                color: var(--ink);
                font-variant-numeric: tabular-nums;
            }
            .theme-value {
                display: block;
                margin-top: 8px;
                color: var(--muted);
                font-size: 8px;
                font-weight: 800;
                letter-spacing: 1px;
            }
            .home-bottomline {
                padding-top: 12px;
                border-top: 1px solid var(--line);
                font-size: 8px;
            }
            @media (max-width: 600px) {
                .mfe-content {
                    padding: 18px 16px;
                }
                .content-grid {
                    grid-template-columns: 1fr;
                    gap: 18px;
                    padding: 22px 0;
                }
                .runtime-note {
                    min-height: 0;
                }
                .home-bottomline {
                    flex-wrap: wrap;
                }
            }
        `,
    ],
})
export class HomeComponent implements OnInit, OnDestroy {
    sessionNote = sessionStorage.getItem("mfe-demo-session") ?? "Northstar workspace";
    theme = document.documentElement.dataset.theme ?? "light";
    uptime = 0;
    private disposeSession?: () => void;
    private disposeTheme?: () => void;
    private intervalId?: number;

    ngOnInit(): void {
        this.disposeSession = subscribe<{ value: string }>(
            EVENTS.session,
            ({ value }) => (this.sessionNote = value),
        );
        this.disposeTheme = subscribe<{ theme: string }>(
            EVENTS.theme,
            ({ theme }) => (this.theme = theme),
        );
        this.intervalId = window.setInterval(() => (this.uptime += 1), 1000);
    }

    ngOnDestroy(): void {
        this.disposeSession?.();
        this.disposeTheme?.();
        if (this.intervalId !== undefined) window.clearInterval(this.intervalId);
    }
}
