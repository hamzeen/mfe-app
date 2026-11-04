export type FrameworkName = "Angular" | "React";

export type MfeState = "loading" | "ready" | "error";

export interface FrameworkActiveDetail {
    framework: FrameworkName;
    route: string;
}

export interface MfeStateDetail {
    app: string;
    state: MfeState;
    message?: string;
}

export interface MfeErrorDetail {
    app: string;
    message: string;
}

export interface ThemeChangedDetail {
    theme: "light" | "dark";
}

export interface SessionChangedDetail {
    value: string;
}

export interface RuntimeImportMap {
    imports: {
        "@mfe/home-angular": string;
        "@mfe/about-react": string;
    };
}

export interface MfeProps {
    domElementGetter: () => HTMLElement;
}

export interface MfeLifecycleModule {
    bootstrap: (props: MfeProps) => Promise<void>;
    mount: (props: MfeProps) => Promise<void>;
    unmount: (props: MfeProps) => Promise<void>;
}
