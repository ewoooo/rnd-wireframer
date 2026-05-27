import type { ComponentPattern, ComponentPatternStatus } from "@cx/types/component-pattern";
import { proposedComponentPatterns } from "./catalog/proposed";
import { registeredComponentPatterns } from "./catalog/registered";

export interface ComponentPatternStore {
	registered: ComponentPattern[];
	proposed: ComponentPattern[];
}

export function loadComponentPatternStore(): ComponentPatternStore {
	return {
		registered: [...registeredComponentPatterns],
		proposed: [...proposedComponentPatterns],
	};
}

export const componentPatternStore = loadComponentPatternStore();

export function listComponentPatterns(status?: ComponentPatternStatus): ComponentPattern[] {
	const store = loadComponentPatternStore();
	if (status === "registered") return store.registered;
	if (status === "proposed") return store.proposed;
	return [...store.registered, ...store.proposed];
}

export function findComponentPattern(id: string): ComponentPattern | undefined {
	return listComponentPatterns().find((pattern) => pattern.id === id);
}
