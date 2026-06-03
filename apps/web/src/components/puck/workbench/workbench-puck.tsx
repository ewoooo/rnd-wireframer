"use client";

import {
	applyPuckAreaData,
	applyPuckComponentData,
	applyPuckScreenData,
	type ItemKind,
	type PuckScreenData,
	type PuckScreenItem,
	renderTreeToPuckAreaData,
	renderTreeToPuckComponentData,
	renderTreeToPuckScreenData,
} from "@cx/adapters/puck";
import { RenderNodeView, type RenderTreeNode, type RenderTreeScreenNode } from "@cx/renderer";
import type { Config, Data } from "@puckeditor/core";
import type { EditScope } from "./edit-scope";

export function buildPuckDataForScope(scope: EditScope): PuckScreenData {
	if (scope.kind === "screen-region") return renderTreeToPuckScreenData(scope.screen);
	if (scope.kind === "area") return renderTreeToPuckAreaData(scope.area);
	return renderTreeToPuckComponentData({ component: scope.component });
}

export function buildPuckConfigForScope(scope: EditScope): Config {
	return {
		components: buildPuckComponentsForScope(scope),
		root: { fields: {} },
	};
}

export function normalizePuckData(data: Data, itemKind: ItemKind): PuckScreenData {
	return {
		content: data.content.map((item) => normalizePuckItem(item, itemKind)),
		root: { props: {} },
		zones: {},
	};
}

export function applyPuckChangeToScope(input: {
	data: PuckScreenData;
	scope: EditScope;
}): RenderTreeScreenNode {
	if (input.scope.kind === "screen-region") {
		return applyPuckScreenData({
			data: input.data,
			screen: input.scope.screen,
		}).node as RenderTreeScreenNode;
	}

	if (input.scope.kind === "area") {
		const areaResult = applyPuckAreaData({
			area: input.scope.area,
			data: input.data,
		});
		return replaceRenderTreeNode(input.scope.screen, areaResult.node as RenderTreeNode);
	}

	const componentResult = applyPuckComponentData({
		component: input.scope.component,
		data: input.data,
	});
	return replaceRenderTreeNode(input.scope.screen, componentResult.node as RenderTreeNode);
}

export function readItemKindForScope(scope: EditScope): ItemKind {
	if (scope.kind === "screen-region") return "screen-region-child";
	if (scope.kind === "area") return "area-child";
	return "component-child";
}

function buildPuckComponentsForScope(scope: EditScope): Config["components"] {
	const components: Config["components"] = {};
	for (const node of readEditableNodes(scope)) {
		components[node.metadata.id] = {
			fields: editableNodeFields,
			label: node.metadata.title,
			render: (props) => {
				const renderNode = applyPreviewProps(node, props);
				return (
					<div className="min-h-8 bg-background">
						<RenderNodeView node={renderNode} />
					</div>
				);
			},
		};
	}
	return components;
}

function readEditableNodes(scope: EditScope): RenderTreeNode[] {
	if (scope.kind === "screen-region") {
		const contents = scope.screen.children.find((child) => child.type === "Screen.Contents");
		return contents?.children ?? [];
	}
	if (scope.kind === "area") return scope.area.children ?? [];
	return scope.component.children?.length ? scope.component.children : [scope.component];
}

function applyPreviewProps(node: RenderTreeNode, props: Record<string, unknown>): RenderTreeNode {
	const nextNode = {
		...node,
		metadata: {
			...node.metadata,
			title: typeof props.title === "string" ? props.title : node.metadata.title,
		},
	};
	const nodePropsJson = props.nodePropsJson;
	if (typeof nodePropsJson !== "string") return nextNode;

	try {
		const parsed = JSON.parse(nodePropsJson) as unknown;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return nextNode;
		return {
			...nextNode,
			props: parsed as RenderTreeNode["props"],
		};
	} catch {
		return nextNode;
	}
}

function normalizePuckItem(item: Data["content"][number], itemKind: ItemKind): PuckScreenItem {
	const props = item.props as Partial<PuckScreenItem["props"]>;
	const nodeId = props.nodeId ?? props.id ?? item.type;

	return {
		props: {
			id: props.id ?? nodeId,
			itemKind: props.itemKind ?? itemKind,
			nodeId,
			nodePropsJson: props.nodePropsJson,
			title: props.title,
			variant: props.variant,
		},
		type: item.type,
	};
}

function replaceRenderTreeNode(
	screen: RenderTreeScreenNode,
	replacement: RenderTreeNode,
): RenderTreeScreenNode {
	return replaceNode(screen, replacement) as RenderTreeScreenNode;
}

function replaceNode(node: RenderTreeNode, replacement: RenderTreeNode): RenderTreeNode {
	if (node.metadata.id === replacement.metadata.id) return replacement;
	return {
		...node,
		children: node.children?.map((child) => replaceNode(child, replacement)),
	};
}

const editableNodeFields: Config["components"][string]["fields"] = {
	nodePropsJson: {
		label: "Props JSON",
		type: "textarea",
	},
	title: {
		label: "Title",
		type: "text",
	},
	variant: {
		label: "Variant",
		type: "text",
	},
};
