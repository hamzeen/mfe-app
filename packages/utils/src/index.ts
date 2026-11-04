import type {
    FrameworkActiveDetail,
    MfeErrorDetail,
    MfeStateDetail,
    SessionChangedDetail,
    ThemeChangedDetail,
} from "@mfe/contracts";

export const EVENTS = {
    frameworkActive: "mfe:framework-active",
    state: "mfe:state",
    error: "mfe:error",
    theme: "shell:theme-changed",
    session: "shell:session-changed",
} as const;

export function emit<T>(name: string, detail: T): void {
    window.dispatchEvent(new CustomEvent<T>(name, { detail }));
}

export function subscribe<T>(name: string, listener: (detail: T) => void): () => void {
    const handler = (event: Event) => listener((event as CustomEvent<T>).detail);
    window.addEventListener(name, handler);
    return () => window.removeEventListener(name, handler);
}

export const emitFrameworkActive = (detail: FrameworkActiveDetail) =>
    emit(EVENTS.frameworkActive, detail);
export const emitMfeState = (detail: MfeStateDetail) => emit(EVENTS.state, detail);
export const emitMfeError = (detail: MfeErrorDetail) => emit(EVENTS.error, detail);
export const emitThemeChanged = (detail: ThemeChangedDetail) => emit(EVENTS.theme, detail);
export const emitSessionChanged = (detail: SessionChangedDetail) => emit(EVENTS.session, detail);
