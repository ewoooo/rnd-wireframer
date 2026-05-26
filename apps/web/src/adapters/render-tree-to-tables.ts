import type { PropValue, WireframeNode, WireframeSchema, WireframeScreenNode } from "@cx/renderer";

import type {
	DatabaseAreaRow,
	DatabaseAreaSet,
	DatabaseComponentRow,
	DatabaseComponentSet,
	DatabaseRegionChild,
	DatabaseScreenRegion,
	DatabaseScreenRow,
	DatabaseScreenSet,
} from "./tables-to-render-tree";

export interface RenderTreeToTablesOptions {
	order?: number;
	pattern?: DatabaseScreenRow["pattern"];
	screenId?: string;
	screenVariantId: string;
}

export interface RenderTreeToTablesResult {
	components: DatabaseComponentSet;
	areas: DatabaseAreaSet;
	screens: DatabaseScreenSet;
	warnings: string[];
}

type RegionKey = keyof DatabaseScreenRow["screen"]["regions"];

const REGION_BY_TYPE: Record<string, RegionKey> = {
	"Screen.Header": "header",
	"Screen.Contents": "contents",
	"Screen.Bottom": "bottom",
};

export function renderTreeToTables(
	schema: WireframeSchema,
	options: RenderTreeToTablesOptions,
): RenderTreeToTablesResult {
	const warnings: string[] = [];
	const screenNode = getSingleScreenNode(schema, warnings);
	const componentsById = new Map<string, DatabaseComponentRow>();
	const areasById = new Map<string, DatabaseAreaRow>();

	const screen: DatabaseScreenRow = {
		id: options.screenId ?? schema.metadata.id,
		order: options.order,
		screenVariantId: options.screenVariantId,
		version: schema.version,
		minRendererVersion: schema.minRendererVersion,
		metadata: {
			title: schema.metadata.title,
			author: schema.metadata.author,
			createdAt: schema.metadata.createdAt,
			updatedAt: schema.metadata.updatedAt,
			description: schema.metadata.description,
		},
		pattern: options.pattern,
		theme: schema.theme,
		data: schema.data,
		screen: {
			type: "screen.page",
			regions: {
				header: extractRegion(screenNode, "header", componentsById, areasById, warnings),
				contents: extractRegion(screenNode, "contents", componentsById, areasById, warnings),
				bottom: extractRegion(screenNode, "bottom", componentsById, areasById, warnings),
			},
		},
	};

	return {
		components: { components: Array.from(componentsById.values()) },
		areas: { areas: Array.from(areasById.values()) },
		screens: { screens: [screen] },
		warnings,
	};
}

function getSingleScreenNode(schema: WireframeSchema, warnings: string[]): WireframeScreenNode {
	const screenNodes = schema.children.filter((node) => node.type === "Screen");
	if (screenNodes.length === 0) {
		throw new Error("WireframeSchema must include a Screen node");
	}
	if (screenNodes.length > 1) {
		warnings.push("Multiple Screen nodes found; only the first Screen node was extracted");
	}
	return screenNodes[0] as WireframeScreenNode;
}

function extractRegion(
	screenNode: WireframeScreenNode,
	regionKey: RegionKey,
	componentsById: Map<string, DatabaseComponentRow>,
	areasById: Map<string, DatabaseAreaRow>,
	warnings: string[],
): DatabaseScreenRegion {
	const region = screenNode.children.find((child) => REGION_BY_TYPE[child.type] === regionKey);
	if (!region) {
		throw new Error(`Screen node must include ${regionKey} region`);
	}

	return {
		type: region.type as DatabaseScreenRegion["type"],
		componentVersion:
			region.componentVersion === screenNode.componentVersion ? undefined : region.componentVersion,
		metadata: { title: region.metadata.title },
		props: region.props,
		children: extractRegionEntries(region.children ?? [], componentsById, areasById, warnings),
	};
}

function extractRegionEntries(
	nodes: WireframeNode[],
	componentsById: Map<string, DatabaseComponentRow>,
	areasById: Map<string, DatabaseAreaRow>,
	warnings: string[],
): DatabaseRegionChild[] {
	return nodes.flatMap((node) => extractRegionEntry(node, componentsById, areasById, warnings));
}

function extractRegionEntry(
	node: WireframeNode,
	componentsById: Map<string, DatabaseComponentRow>,
	areasById: Map<string, DatabaseAreaRow>,
	warnings: string[],
): DatabaseRegionChild[] {
	if (isGeneratedPageStack(node)) {
		return extractRegionEntries(node.children ?? [], componentsById, areasById, warnings);
	}

	if (isGeneratedDivider(node)) {
		warnings.push(`Dropped generated divider wrapper: ${node.metadata.id}`);
		return [];
	}

	if (isAreaNode(node)) {
		const areaId = getAreaId(node);
		areasById.set(areaId, extractArea(node, areaId, componentsById, warnings));
		return [{ kind: "area", id: areaId }];
	}

	componentsById.set(node.metadata.id, nodeToComponent(node));
	return [{ kind: "component", id: node.metadata.id }];
}

function extractArea(
	node: WireframeNode,
	areaId: string,
	componentsById: Map<string, DatabaseComponentRow>,
	warnings: string[],
): DatabaseAreaRow {
	const { areaCode: _areaCode, ...props } = node.props ?? {};

	return {
		id: areaId,
		type: "area.static",
		version: node.componentVersion,
		metadata: {
			title: node.metadata.title,
			author: node.metadata.author,
			createdAt: node.metadata.createdAt,
			updatedAt: node.metadata.updatedAt,
			description: node.metadata.description,
		},
		props: Object.keys(props).length > 0 ? (props as Record<string, PropValue>) : undefined,
		children: extractAreaChildren(node.children ?? [], componentsById, warnings),
	};
}

function nodeToComponent(node: WireframeNode): DatabaseComponentRow {
	return {
		id: node.metadata.id,
		type: node.type,
		version: node.componentVersion,
		metadata: {
			title: node.metadata.title,
			author: node.metadata.author,
			createdAt: node.metadata.createdAt,
			updatedAt: node.metadata.updatedAt,
			description: node.metadata.description,
		},
		pattern: { id: "default", variant: "default" },
		children: [
			{
				component: { type: node.type },
				props: (node.props ?? {}) as Record<string, PropValue>,
			},
		],
		events: node.events as Record<string, unknown> | undefined,
	};
}

function extractAreaChildren(
	nodes: WireframeNode[],
	componentsById: Map<string, DatabaseComponentRow>,
	warnings: string[],
) {
	const components: DatabaseAreaRow["children"] = [];

	for (const node of nodes) {
		if (isGeneratedPageStack(node)) {
			components.push(...extractAreaChildren(node.children ?? [], componentsById, warnings));
			continue;
		}
		if (isGeneratedDivider(node)) {
			warnings.push(`Dropped generated divider wrapper: ${node.metadata.id}`);
			continue;
		}
		if (isAreaNode(node)) {
			warnings.push(`Nested Area node was not extracted as an area table row: ${node.metadata.id}`);
			continue;
		}
		componentsById.set(node.metadata.id, nodeToComponent(node));
		components.push({ kind: "component", id: node.metadata.id });
	}

	return components;
}

function getAreaId(node: WireframeNode) {
	return node.metadata.id;
}

/** 정규 area type 인지 판정. legacy "Area"와 canonical "area.static"/"area.dynamic" 모두 인식. */
function isAreaNode(node: WireframeNode): boolean {
	const t = node.type;
	return t === "Area" || t === "area.static" || t === "area.dynamic";
}

function isGeneratedPageStack(node: WireframeNode) {
	return node.type === "PageStack";
}

function isGeneratedDivider(node: WireframeNode) {
	return node.type === "Divider" && /-divider-\d+$/.test(node.metadata.id);
}
