import "zone.js";
import { ApplicationRef, ComponentRef, createComponent } from "@angular/core";
import { createApplication } from "@angular/platform-browser";
import type { MfeProps } from "@mfe/contracts";
import { emitFrameworkActive, emitMfeError, emitMfeState } from "@mfe/utils";
import { HomeComponent } from "./home.component";

let application: ApplicationRef | null = null;
let component: ComponentRef<HomeComponent> | null = null;
let container: HTMLElement | null = null;

export async function bootstrap(): Promise<void> {}

export async function mount(props: MfeProps): Promise<void> {
    container = props.domElementGetter();
    emitMfeState({ app: "home-angular", state: "loading", message: "Starting Angular frontend" });
    try {
        application = await createApplication();
        component = createComponent(HomeComponent, {
            environmentInjector: application.injector,
            hostElement: document.createElement("div"),
        });
        component.location.nativeElement.dataset.mfe = "home-angular";
        container.replaceChildren(component.location.nativeElement);
        application.attachView(component.hostView);
        emitFrameworkActive({ framework: "Angular", route: window.location.pathname });
        emitMfeState({
            app: "home-angular",
            state: "ready",
            message: "Angular frontend is mounted",
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Angular mount failed";
        emitMfeError({ app: "home-angular", message });
        emitMfeState({
            app: "home-angular",
            state: "error",
            message: "Angular frontend failed to mount",
        });
        await unmount(props);
        throw error;
    }
}

export async function unmount(_props?: MfeProps): Promise<void> {
    if (component && application) application.detachView(component.hostView);
    component?.destroy();
    component = null;
    application?.destroy();
    application = null;
    container?.replaceChildren();
    container = null;
}
