"use client";

import { type PuckCatalogItem, screenRegionSlotNames } from "@cx/adapters/puck";
import { RenderNodeView, type RenderTreeNode, RenderTreeView } from "@cx/renderer";
import type { Config } from "@puckeditor/core";
import type { ReactNode } from "react";
import { buildFieldsForNodeType } from "@/lib/workbench-puck/puck-fields";
import { applyPreviewProps, stringifyNodeProps } from "@/lib/workbench-puck/puck-props";
import {
	createPreviewCatalogNode,
	readEditableNodes,
	readItemKindForScope,
} from "@/lib/workbench-puck/puck-scope";
import type { EditScope } from "@/model/puck-edit-scope";

export function buildPuckConfigForScope(scope: EditScope, catalogItems: PuckCatalogItem[]): Config {
	return {
		components: buildPuckComponentsForScope(scope, catalogItems),
		root: buildPuckRootForScope(scope),
	};
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
			render: (props) => <PuckNodePreview node={applyPreviewProps(node, props)} />,
		};
	}
	for (const catalogItem of catalogItems) {
		components[catalogItem.puckType] = {
			defaultProps: {
				...catalogItem.defaultProps,
				id: catalogItem.nodeId,
				itemKind: readItemKindForScope(scope),
				nodeId: catalogItem.nodeId,
				nodePropsJson: stringifyNodeProps(catalogItem.defaultProps),
				title: catalogItem.title,
			},
			fields: buildFieldsForNodeType(catalogItem.nodeType),
			label: catalogItem.title,
			render: (props) => (
				<PuckNodePreview node={applyPreviewProps(createPreviewCatalogNode(catalogItem), props)} />
			),
		};
	}
	return components;
}

function buildPuckRootForScope(scope: EditScope): Config["root"] {
	if (scope.kind !== "screen-region") return { fields: {} };

	return {
		fields: {
			[screenRegionSlotNames.bottom]: { type: "slot" },
			[screenRegionSlotNames.contents]: { type: "slot" },
			[screenRegionSlotNames.header]: { type: "slot" },
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

function PuckNodePreview({ node }: { node: RenderTreeNode }) {
	return (
		<div className="pointer-events-none min-h-8 bg-background">
			<RenderNodeView node={node} />
		</div>
	);
}

type PuckSlotRenderer = (props?: { className?: string; minEmptyHeight?: number }) => ReactNode;
