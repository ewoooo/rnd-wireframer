import type { RendererRuntime } from "../interpreter/types";
import { renderPrimitive } from "./render-primitive";
import { resolveArea } from "./resolve-area";
import { resolveComponent } from "./resolve-component";
import { resolveLayout } from "./resolve-layout";
import {
	throwMissingComponent,
	throwMissingLayout,
	throwMissingPrimitive,
} from "./missing-policy";

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
