import type { RendererRuntime } from "../interpreter/types";
import { throwMissingComponent, throwMissingLayout, throwMissingPrimitive } from "./missing-policy";
import { renderPrimitive } from "./render-primitive";
import { resolveArea } from "./resolve-area";
import { resolveComponent } from "./resolve-component";
import { resolveLayout } from "./resolve-layout";

export function createRendererRuntime(): RendererRuntime {
	return {
		onMissingComponent: throwMissingComponent,
		onMissingLayout: throwMissingLayout,
		onMissingPrimitive: throwMissingPrimitive,
		renderPrimitive,
		resolveArea,
		resolveComponent,
		resolveLayout,
	};
}
