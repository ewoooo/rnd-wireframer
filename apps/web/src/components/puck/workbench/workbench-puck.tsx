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
	screenRegionZoneIds,
} from "@cx/adapters/puck";
import { RenderNodeView, type RenderTreeNode, type RenderTreeScreenNode } from "@cx/renderer";
import type { Config, Data } from "@puckeditor/core";
import { DropZone } from "@puckeditor/core";
import type { EditScope } from "./edit-scope";

export function buildPuckDataForScope(scope: EditScope): PuckScreenData {
	if (scope.kind === "screen-region") return renderTreeToPuckScreenData(scope.screen);
	if (scope.kind === "area") return renderTreeToPuckAreaData(scope.area);
	return renderTreeToPuckComponentData({ component: scope.component });
}

export function buildPuckConfigForScope(scope: EditScope): Config {
	return {
		components: buildPuckComponentsForScope(scope),
		root: buildPuckRootForScope(scope),
	};
}

export function normalizePuckData(data: Data, itemKind: ItemKind): PuckScreenData {
	return {
		content: data.content.map((item) => normalizePuckItem(item, itemKind)),
		root: { props: {} },
		zones: normalizePuckZones(data.zones, itemKind),
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

function buildPuckRootForScope(scope: EditScope): Config["root"] {
	if (scope.kind !== "screen-region") return { fields: {} };

	return {
		fields: {},
		render: () => (
			<div className="mx-auto flex min-h-full w-full max-w-[390px] flex-col bg-background">
				<ScreenRegionDropZone label="Header" zone={screenRegionZoneIds.header} />
				<ScreenRegionDropZone label="Contents" zone={screenRegionZoneIds.contents} />
				<ScreenRegionDropZone label="Bottom" zone={screenRegionZoneIds.bottom} />
			</div>
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

function ScreenRegionDropZone({ label, zone }: { label: string; zone: string }) {
	return (
		<section className="min-h-16 border-b border-dashed border-border last:border-b-0">
			<div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
				{label}
			</div>
			<DropZone className="min-h-12 px-3 pb-3" minEmptyHeight={48} zone={zone} />
		</section>
	);
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
