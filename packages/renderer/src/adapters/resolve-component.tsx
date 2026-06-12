import * as ComponentsModule from "@cx/external/registry";
import { canonicalizeComponentType, componentExportNameOf } from "@cx/external/resolver";
import { type ComponentType, createElement, type ReactNode } from "react";
import type { RenderTreeNode } from "../tree/types";
import { buildComponentProps } from "./build-component-props";

export function resolveComponent({
	node,
	props,
	renderNode,
}: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
	renderNode?: (node: RenderTreeNode) => ReactNode;
}): ReactNode | undefined {
	const Component = resolveComponentByType(node.type);
	if (!Component) return undefined;

	const componentProps = buildComponentProps(node.type, props, { renderNode });
	return createElement(Component, { key: node.metadata.id, ...componentProps });
}

const componentsByType: Record<string, ComponentType<unknown>> = {};

for (const [name, value] of Object.entries(ComponentsModule)) {
	if (typeof value === "function") {
		componentsByType[name] = value as ComponentType<unknown>;
	}
}

// 캐논화(@cx/external/resolver) → registry export 이름. canonical 실패 시 raw type으로 fallback.
function resolveComponentByType(type: string): ComponentType<unknown> | undefined {
	return componentsByType[componentExportNameOf(canonicalizeComponentType(type) ?? type)];
}
