import * as ComponentsModule from "@cx/external/registry";
import { type ComponentType, createElement, type ReactNode } from "react";
import type { RenderTreeNode } from "../tree/types";
import { buildComponentProps } from "./build-component-props";

export function resolveComponent({
	node,
	props,
}: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
}): ReactNode | undefined {
	const Component = resolveComponentByType(node.type);
	if (!Component) return undefined;

	const componentProps = buildComponentProps(node.type, props);
	return createElement(Component, { key: node.metadata.id, ...componentProps });
}

const componentsByType: Record<string, ComponentType<unknown>> = {};

for (const [name, value] of Object.entries(ComponentsModule)) {
	if (typeof value === "function") {
		componentsByType[name] = value as ComponentType<unknown>;
	}
}

// canonical kiki.X → registry export (kiki. 접두사 strip 단일 규칙). alias 해석 아님.
function resolveComponentByType(type: string): ComponentType<unknown> | undefined {
	return componentsByType[type] ?? componentsByType[type.replace(/^kiki\./, "")];
}
