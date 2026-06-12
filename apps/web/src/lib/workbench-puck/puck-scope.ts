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
import { getPrimitivePuckCatalogItems } from "@cx/external/puck";
import type { RenderTreeNode, RenderTreeScreenNode } from "@cx/renderer";
import type { Data } from "@puckeditor/core";
import type { EditScope } from "@/model/puck-edit-scope";
import { readTypedPreviewProps } from "./puck-props";

const itemKindByScope = {
	area: "area-child",
	component: "component-child",
	"screen-region": "screen-region-child",
} satisfies Record<EditScope["kind"], ItemKind>;

const catalogPrefixByScope = {
	area: "component",
	"screen-region": "area",
} satisfies Partial<Record<EditScope["kind"], string>>;

export function buildPuckDataForScope(scope: EditScope): PuckScreenData {
	if (scope.kind === "screen-region") return renderTreeToPuckScreenData(scope.screen);
	if (scope.kind === "area") return renderTreeToPuckAreaData(scope.area);
	return renderTreeToPuckComponentData({ component: scope.component });
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
	return itemKindByScope[scope.kind];
}

export function resolveCatalogItemsForScope(scope: EditScope): PuckCatalogItem[] {
	if (scope.kind === "screen-region") {
		return scope.screen.children
			.flatMap((region) => region.children ?? [])
			.map((node) => renderTreeNodeToCatalogItem(node, catalogPrefixByScope[scope.kind]));
	}

	if (scope.kind === "area") {
		return scope.screen.children
			.flatMap((region) => region.children ?? [])
			.flatMap((area) => area.children ?? [])
			.map((node) => renderTreeNodeToCatalogItem(node, catalogPrefixByScope[scope.kind]));
	}

	return getPrimitivePuckCatalogItems().map((item) => ({
		...item,
		defaultProps: item.defaultProps as PuckCatalogItem["defaultProps"],
	}));
}

export function readEditableNodes(scope: EditScope): RenderTreeNode[] {
	if (scope.kind === "screen-region") {
		return scope.screen.children.flatMap((region) => region.children ?? []);
	}
	if (scope.kind === "area") return scope.area.children ?? [];
	return scope.component.children?.length ? scope.component.children : [scope.component];
}

export function renderTreeNodeToCatalogItem(node: RenderTreeNode, prefix: string): PuckCatalogItem {
	return {
		componentVersion: node.componentVersion,
		defaultChildren: node.children,
		defaultProps: node.props,
		nodeId: node.metadata.id,
		nodeType: node.type,
		puckType: `catalog:${prefix}:${node.metadata.id}`,
		title: node.metadata.title,
	};
}

export function createPreviewCatalogNode(catalogItem: PuckCatalogItem): RenderTreeNode {
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
