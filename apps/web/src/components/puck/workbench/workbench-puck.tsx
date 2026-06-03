"use client";

import {
	applyPuckAreaData,
	applyPuckComponentData,
	applyPuckScreenData,
	type ItemKind,
	type PuckCatalogItem,
	type PuckScreenData,
	type PuckScreenItem,
	renderTreeToPuckAreaData,
	renderTreeToPuckComponentData,
	renderTreeToPuckScreenData,
	screenRegionSlotNames,
} from "@cx/adapters/puck";
import { getComponentCatalogEntry } from "@cx/components/catalog";
import { getPrimitivePuckCatalogItems } from "@cx/components/puck";
import {
	RenderNodeView,
	type RenderTreeNode,
	type RenderTreeScreenNode,
	RenderTreeView,
} from "@cx/renderer";
import type { Config, Data } from "@puckeditor/core";
import type { ReactNode } from "react";
import type { EditScope } from "./edit-scope";

export function buildPuckDataForScope(scope: EditScope): PuckScreenData {
	if (scope.kind === "screen-region") return renderTreeToPuckScreenData(scope.screen);
	if (scope.kind === "area") return renderTreeToPuckAreaData(scope.area);
	return renderTreeToPuckComponentData({ component: scope.component });
}

export function buildPuckConfigForScope(scope: EditScope): Config {
	const catalogItems = resolveCatalogItemsForScope(scope);
	return {
		components: buildPuckComponentsForScope(scope, catalogItems),
		root: buildPuckRootForScope(scope),
	};
}

export function normalizePuckData(data: Data, itemKind: ItemKind): PuckScreenData {
	return {
		content: data.content.map((item) => normalizePuckItem(item, itemKind)),
		root: { props: normalizePuckSlotProps(data.root?.props ?? {}, itemKind) },
		zones: normalizePuckZones(data.zones, itemKind),
	};
}

export function applyPuckChangeToScope(input: {
	catalogItems?: PuckCatalogItem[];
	data: PuckScreenData;
	scope: EditScope;
}): RenderTreeScreenNode {
	if (input.scope.kind === "screen-region") {
		return applyPuckScreenData({
			catalogItems: input.catalogItems,
			data: input.data,
			screen: input.scope.screen,
		}).node as RenderTreeScreenNode;
	}

	if (input.scope.kind === "area") {
		const areaResult = applyPuckAreaData({
			area: input.scope.area,
			catalogItems: input.catalogItems,
			data: input.data,
		});
		return replaceRenderTreeNode(input.scope.screen, areaResult.node as RenderTreeNode);
	}

	const componentResult = applyPuckComponentData({
		catalogItems: input.catalogItems,
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

export function resolveCatalogItemsForScope(scope: EditScope): PuckCatalogItem[] {
	if (scope.kind === "screen-region") {
		return scope.screen.children
			.flatMap((region) => region.children ?? [])
			.map((node) => renderTreeNodeToCatalogItem(node, "area"));
	}

	if (scope.kind === "area") {
		return scope.screen.children
			.flatMap((region) => region.children ?? [])
			.flatMap((area) => area.children ?? [])
			.map((node) => renderTreeNodeToCatalogItem(node, "component"));
	}

	return getPrimitivePuckCatalogItems().map((item) => ({
		...item,
		defaultProps: item.defaultProps as PuckCatalogItem["defaultProps"],
	}));
}

function buildPuckComponentsForScope(
	scope: EditScope,
	catalogItems: PuckCatalogItem[],
): Config["components"] {
	const components: Config["components"] = {};
	for (const node of readEditableNodes(scope)) {
		components[node.metadata.id] = {
			fields: buildFieldsForNodeType(node.type),
			label: node.metadata.title,
			render: (props) => {
				const renderNode = applyPreviewProps(node, props);
				return (
					<div className="pointer-events-none min-h-8 bg-background">
						<RenderNodeView node={renderNode} />
					</div>
				);
			},
		};
	}
	for (const catalogItem of catalogItems) {
		components[catalogItem.puckType] = {
			defaultProps: {
				...catalogItem.defaultProps,
				itemKind: readItemKindForScope(scope),
				nodePropsJson: stringifyNodeProps(catalogItem.defaultProps),
				title: catalogItem.title,
			},
			fields: buildFieldsForNodeType(catalogItem.nodeType),
			label: catalogItem.title,
			render: (props) => {
				const renderNode = applyPreviewProps(createPreviewCatalogNode(catalogItem), props);
				return (
					<div className="pointer-events-none min-h-8 bg-background">
						<RenderNodeView node={renderNode} />
					</div>
				);
			},
		};
	}
	return components;
}

function buildPuckRootForScope(scope: EditScope): Config["root"] {
	if (scope.kind !== "screen-region") return { fields: {} };

	return {
		fields: {
			[screenRegionSlotNames.header]: { type: "slot" },
			[screenRegionSlotNames.contents]: { type: "slot" },
			[screenRegionSlotNames.bottom]: { type: "slot" },
		},
		render: (props: Record<string, unknown>) => (
			<RenderTreeView
				node={scope.screen}
				renderRegion={({ region }) => {
					const Slot = props[screenRegionSlotNames[region]] as PuckSlotRenderer | undefined;
					return Slot ? <Slot minEmptyHeight={0} /> : null;
				}}
			/>
		),
	};
}

function readEditableNodes(scope: EditScope): RenderTreeNode[] {
	if (scope.kind === "screen-region") {
		return scope.screen.children.flatMap((region) => region.children ?? []);
	}
	if (scope.kind === "area") return scope.area.children ?? [];
	return scope.component.children?.length ? scope.component.children : [scope.component];
}

type PuckSlotRenderer = (props?: { className?: string; minEmptyHeight?: number }) => ReactNode;

function normalizePuckSlotProps(
	props: Record<string, unknown>,
	itemKind: ItemKind,
): PuckScreenData["root"]["props"] {
	const slots: PuckScreenData["root"]["props"] = {};
	for (const region of Object.values(screenRegionSlotNames)) {
		const value = props[region];
		if (Array.isArray(value)) {
			slots[region] = value.map((item) =>
				normalizePuckItem(item as Data["content"][number], itemKind),
			);
		}
	}
	return slots;
}

function renderTreeNodeToCatalogItem(node: RenderTreeNode, prefix: string): PuckCatalogItem {
	return {
		componentVersion: node.componentVersion,
		defaultChildren: node.children,
		defaultProps: node.props,
		nodeType: node.type,
		puckType: `catalog:${prefix}:${node.metadata.id}`,
		title: node.metadata.title,
	};
}

function createPreviewCatalogNode(catalogItem: PuckCatalogItem): RenderTreeNode {
	return {
		children: catalogItem.defaultChildren,
		componentVersion: catalogItem.componentVersion ?? "1.0.0",
		metadata: {
			id: catalogItem.puckType,
			title: catalogItem.title,
		},
		props: catalogItem.defaultProps,
		type: catalogItem.nodeType,
	};
}

function stringifyNodeProps(props: RenderTreeNode["props"]): string {
	if (!props) return "{}";
	return JSON.stringify(props, null, 2);
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
	if (typeof nodePropsJson !== "string") {
		return {
			...nextNode,
			props: {
				...(nextNode.props ?? {}),
				...readTypedPreviewProps(props),
			},
		};
	}

	try {
		const parsed = JSON.parse(nodePropsJson) as unknown;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return nextNode;
		return {
			...nextNode,
			props: {
				...(parsed as RenderTreeNode["props"]),
				...readTypedPreviewProps(props),
			},
		};
	} catch {
		return {
			...nextNode,
			props: {
				...(nextNode.props ?? {}),
				...readTypedPreviewProps(props),
			},
		};
	}
}

function normalizePuckItem(item: Data["content"][number], itemKind: ItemKind): PuckScreenItem {
	const props = item.props as Partial<PuckScreenItem["props"]>;
	const nodeId = props.nodeId ?? props.id ?? item.type;

	return {
		props: {
			...readTypedPreviewProps(item.props as Record<string, unknown>),
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

function normalizePuckZones(
	zones: Data["zones"] | undefined,
	itemKind: ItemKind,
): PuckScreenData["zones"] {
	const nextZones: PuckScreenData["zones"] = {};
	for (const [zoneId, items] of Object.entries(zones ?? {})) {
		nextZones[zoneId] = items.map((item) => normalizePuckItem(item, itemKind));
	}
	return nextZones;
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

function buildFieldsForNodeType(nodeType: string): Config["components"][string]["fields"] {
	const fields: Config["components"][string]["fields"] = {
		title: {
			label: "Title",
			type: "text",
		},
	};
	const entry = getComponentCatalogEntry(nodeType);

	for (const [propName, contract] of Object.entries(entry?.props ?? {})) {
		fields[propName] = buildFieldForPropContract(propName, contract);
	}

	if (!fields.variant) {
		fields.variant = {
			label: "Variant",
			type: "text",
		};
	}
	fields.nodePropsJson = {
		label: "Props JSON",
		type: "textarea",
	};
	return fields;
}

function buildFieldForPropContract(
	propName: string,
	contract: NonNullable<ReturnType<typeof getComponentCatalogEntry>>["props"][string],
) {
	const label = propName;
	if (contract.type === "enum" && contract.values?.length) {
		return {
			label,
			options: contract.values.map((value) => ({ label: value, value })),
			type: "select" as const,
		};
	}
	if (contract.type === "boolean") {
		return {
			label,
			options: [
				{ label: "true", value: true },
				{ label: "false", value: false },
			],
			type: "radio" as const,
		};
	}
	if (contract.type === "number") {
		return {
			label,
			type: "number" as const,
		};
	}
	if (contract.type === "array" || contract.type === "node") {
		return {
			label,
			type: "textarea" as const,
		};
	}
	return {
		label,
		type: "text" as const,
	};
}

function readTypedPreviewProps(props: Record<string, unknown>): RenderTreeNode["props"] {
	const typedProps: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (puckReservedPropNames.has(key) || value === undefined) continue;
		typedProps[key] = value;
	}
	return typedProps as RenderTreeNode["props"];
}

const puckReservedPropNames = new Set(["id", "itemKind", "nodeId", "nodePropsJson", "title"]);
