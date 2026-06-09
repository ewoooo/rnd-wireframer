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
	// RadioGroup: kiki 대응 컴포넌트가 없는 유일한 composite (options fan-out).
	if (node.type === "RadioGroup") return renderRadioGroup(node, props);

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

// 단일 예외 composite: options(string[] | {value,label}[])를 실제 kiki Radio 행으로 펼친다.
function renderRadioGroup(
	node: RenderTreeNode,
	props: Record<string, unknown>,
): ReactNode | undefined {
	const Radio = resolveComponentByType("kiki.Radio");
	if (!Radio) return undefined;

	const options = Array.isArray(props.options) ? props.options : [];
	const selectedValue = props.selectedValue;

	return createElement(
		"div",
		{ key: node.metadata.id },
		options.map((option, index) => {
			const isObject = typeof option === "object" && option !== null;
			const value = isObject ? (option as { value?: unknown }).value : option;
			const label = isObject ? (option as { label?: unknown }).label : option;
			return createElement(Radio, {
				key: `${node.metadata.id}.${index}`,
				label: typeof label === "string" ? label : String(label ?? ""),
				checked: value === selectedValue,
			});
		}),
	);
}
