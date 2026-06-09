import * as ComponentsModule from "@cx/external/registry";
import { AppBar, Callout, ListSelected, ListText } from "@cx/external/registry";
import { getComponentCatalogEntry } from "@cx/external/resolver";
import { type ComponentType, createElement, type ReactNode } from "react";
import { toText } from "../runtime/text";
import type { RenderTreeNode } from "../tree/types";
import { buildComponentProps } from "./build-component-props";

export function resolveComponent({
	node,
	props: resolvedProps,
}: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
}): ReactNode | undefined {
	const Component = resolveComponentByType(node.type);
	if (!Component) {
		const compositeRenderer = resolveCompositeRenderer(node.type);
		if (compositeRenderer) return compositeRenderer({ node, props: resolvedProps });
		return undefined;
	}

	const componentProps = buildComponentProps(node.type, resolvedProps, {
		title: node.metadata.title,
		description: node.metadata.description,
	});
	return createElement(Component, { key: node.metadata.id, ...componentProps });
}

function resolveCompositeRenderer(type: string): ComponentRenderer | undefined {
	const canonicalType = getComponentCatalogEntry(type)?.type ?? type;
	return COMPONENT_RENDERERS[canonicalType] ?? COMPONENT_RENDERERS[type];
}

type ComponentRenderer = (input: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
}) => ReactNode;

const COMPONENT_RENDERERS: Record<string, ComponentRenderer> = {
	Accordion: ({ node, props: resolvedProps }) => {
		const props = buildComponentProps(node.type, resolvedProps, {
			title: node.metadata.title,
			description: node.metadata.description,
		});
		return (
			<Callout key={node.metadata.id} title={toText(props.title, node.metadata.title)}>
				{toText(props.description, "")}
			</Callout>
		);
	},
	SectionMessage: ({ node, props: resolvedProps }) => {
		const props = buildComponentProps(node.type, resolvedProps, {
			title: node.metadata.title,
			description: node.metadata.description,
		});
		return (
			<Callout key={node.metadata.id} title={toText(props.title, node.metadata.title)}>
				{toText(props.description, "")}
			</Callout>
		);
	},
	ListCell: ({ node, props: resolvedProps }) => {
		const props = buildComponentProps(node.type, resolvedProps, {
			title: node.metadata.title,
			subText: node.metadata.description,
		});
		return (
			<ListText
				key={node.metadata.id}
				title={toText(props.title, node.metadata.title)}
				subText={toText(props.subText, "")}
			/>
		);
	},
	Checkbox: ({ node, props: resolvedProps }) => {
		const props = buildComponentProps(node.type, resolvedProps, {
			label: node.metadata.title,
		});
		return (
			<ListSelected
				key={node.metadata.id}
				type="checkbox"
				label={toText(props.label, node.metadata.title)}
				checked={resolvedProps.checked !== undefined ? Boolean(resolvedProps.checked) : undefined}
				showButton={false}
				showPrice={false}
			/>
		);
	},
	RadioText: renderRadioRow,
	HeaderBase: ({ node, props: resolvedProps }) => {
		const props = buildComponentProps(node.type, resolvedProps, {
			titleContent: node.metadata.title,
		});
		return (
			<AppBar
				key={node.metadata.id}
				title={toText(props.titleContent, node.metadata.title)}
				showBack={Boolean(props.showBackButton)}
				showLogo={Boolean(props.showLogo)}
			/>
		);
	},
};

function renderRadioRow({
	node,
	props: resolvedProps,
}: {
	node: RenderTreeNode;
	props: Record<string, unknown>;
}): ReactNode {
	const props = buildComponentProps(node.type, resolvedProps, {
		label: node.metadata.title,
	});
	return (
		<ListSelected
			key={node.metadata.id}
			type="radio"
			label={toText(props.label, node.metadata.title)}
			checked={resolvedProps.checked !== undefined ? Boolean(resolvedProps.checked) : undefined}
			showButton={false}
			showPrice={false}
		/>
	);
}

const componentsByType: Record<string, ComponentType<unknown>> = {};

for (const [name, value] of Object.entries(ComponentsModule)) {
	if (typeof value === "function") {
		componentsByType[name] = value as ComponentType<unknown>;
	}
}

function resolveComponentByType(type: string): ComponentType<unknown> | undefined {
	return componentsByType[type] ?? componentsByType[type.replace(/^kiki\./, "")];
}
