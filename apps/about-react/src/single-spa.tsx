import { Component, type ErrorInfo, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { MfeProps } from "@mfe/contracts";
import { emitFrameworkActive, emitMfeError, emitMfeState } from "@mfe/utils";
import { About } from "./about";
import styles from "./about.css?inline";

let root: Root | null = null;
let styleElement: HTMLStyleElement | null = null;

interface ErrorBoundaryProps {
    children: ReactNode;
}

interface ErrorBoundaryState {
    failed: boolean;
}

class MfeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { failed: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { failed: true };
    }

    componentDidCatch(error: Error, _info: ErrorInfo): void {
        emitMfeError({ app: "about-react", message: error.message });
        emitMfeState({
            app: "about-react",
            state: "error",
            message: "React frontend encountered a rendering error",
        });
    }

    render() {
        return this.state.failed ? null : this.props.children;
    }
}

export async function bootstrap(): Promise<void> {}

export async function mount(props: MfeProps): Promise<void> {
    const container = props.domElementGetter();
    emitMfeState({ app: "about-react", state: "loading", message: "Starting React frontend" });
    try {
        styleElement = document.createElement("style");
        styleElement.dataset.mfeStyles = "about-react";
        styleElement.textContent = styles;
        document.head.append(styleElement);
        root = createRoot(container);
        root.render(
            <MfeErrorBoundary>
                <About
                    onReady={() => {
                        emitFrameworkActive({
                            framework: "React",
                            route: window.location.pathname,
                        });
                        emitMfeState({
                            app: "about-react",
                            state: "ready",
                            message: "React frontend committed",
                        });
                    }}
                />
            </MfeErrorBoundary>,
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "React mount failed";
        emitMfeError({ app: "about-react", message });
        emitMfeState({
            app: "about-react",
            state: "error",
            message: "React frontend failed to mount",
        });
        await unmount(props);
        throw error;
    }
}

export async function unmount(_props?: MfeProps): Promise<void> {
    root?.unmount();
    root = null;
    styleElement?.remove();
    styleElement = null;
}
