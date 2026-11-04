/// <reference types="vite/client" />

declare module "@mfe/home-angular" {
    import type { MfeLifecycleModule } from "@mfe/contracts";
    const lifecycle: MfeLifecycleModule;
    export const bootstrap: MfeLifecycleModule["bootstrap"];
    export const mount: MfeLifecycleModule["mount"];
    export const unmount: MfeLifecycleModule["unmount"];
    export default lifecycle;
}

declare module "@mfe/about-react" {
    import type { MfeLifecycleModule } from "@mfe/contracts";
    const lifecycle: MfeLifecycleModule;
    export const bootstrap: MfeLifecycleModule["bootstrap"];
    export const mount: MfeLifecycleModule["mount"];
    export const unmount: MfeLifecycleModule["unmount"];
    export default lifecycle;
}
