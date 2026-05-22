import type { PropValue, WireframeNode, WireframeSchema, WireframeScreenNode } from "@cx/renderer";

import type {
	SampleComposite,
	SampleCompositeSet,
	SampleArea,
	SampleAreaSet,
	SampleRenderEntry,
	SampleScreen,
	SampleScreenRegion,
	SampleScreenSet,
} from "./tables-to-render-tree";

export interface RenderTreeToTablesOptions {
	order?: number;
	pattern?: SampleScreen["pattern"];
	screenId?: string;
	screenVariantId: string;
}

export interface RenderTreeToTablesResult {
	composites: SampleCompositeSet;
	areas: SampleAreaSet;
	screens: SampleScreenSet;
	warnings: string[];
}

type RegionKey = keyof SampleScreen["screen"]["regions"];

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
	const compositesById = new Map<string, SampleComposite>();
	const areasById = new Map<string, SampleArea>();

	const screen: SampleScreen = {
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
				header: extractRegion(screenNode, "header", compositesById, areasById, warnings),
				contents: extractRegion(screenNode, "contents", compositesById, areasById, warnings),
				bottom: extractRegion(screenNode, "bottom", compositesById, areasById, warnings),
			},
		},
	};

	return {
		composites: { composites: Array.from(compositesById.values()) },
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
	compositesById: Map<string, SampleComposite>,
	areasById: Map<string, SampleArea>,
	warnings: string[],
): SampleScreenRegion {
	const region = screenNode.children.find((child) => REGION_BY_TYPE[child.type] === regionKey);
	if (!region) {
		throw new Error(`Screen node must include ${regionKey} region`);
	}

	return {
		type: region.type as SampleScreenRegion["type"],
		componentVersion:
			region.componentVersion === screenNode.componentVersion ? undefined : region.componentVersion,
		metadata: { title: region.metadata.title },
		props: region.props,
		children: extractRegionEntries(region.children ?? [], compositesById, areasById, warnings),
	};
}

function extractRegionEntries(
	nodes: WireframeNode[],
	compositesById: Map<string, SampleComposite>,
	areasById: Map<string, SampleArea>,
	warnings: string[],
): SampleRenderEntry[] {
	return nodes.flatMap((node) => extractRegionEntry(node, compositesById, areasById, warnings));
}

function extractRegionEntry(
	node: WireframeNode,
	compositesById: Map<string, SampleComposite>,
	areasById: Map<string, SampleArea>,
	warnings: string[],
): SampleRenderEntry[] {
	if (isGeneratedPageStack(node)) {
		return extractRegionEntries(node.children ?? [], compositesById, areasById, warnings);
	}

	if (isGeneratedDivider(node)) {
		warnings.push(`Dropped generated divider wrapper: ${node.metadata.id}`);
		return [];
	}

	if (isAreaNode(node)) {
		const areaId = getAreaId(node);
		areasById.set(areaId, extractArea(node, areaId, compositesById, warnings));
		return [{ kind: "area", id: areaId }];
	}

	compositesById.set(node.metadata.id, nodeToComposite(node));
	return [{ kind: "composite", id: node.metadata.id }];
}

function extractArea(
	node: WireframeNode,
	areaId: string,
	compositesById: Map<string, SampleComposite>,
	warnings: string[],
): SampleArea {
	if (!node.props || !("areaCode" in node.props)) {
		warnings.push(`Area node ${node.metadata.id} is missing props.areaCode`);
	}

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
		children: extractAreaChildren(node.children ?? [], compositesById, warnings),
	};
}

function nodeToComposite(node: WireframeNode): SampleComposite {
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
	compositesById: Map<string, SampleComposite>,
	warnings: string[],
) {
	const composites: SampleArea["children"] = [];

	for (const node of nodes) {
		if (isGeneratedPageStack(node)) {
			composites.push(...extractAreaChildren(node.children ?? [], compositesById, warnings));
			continue;
		}
		if (isGeneratedDivider(node)) {
			warnings.push(`Dropped generated divider wrapper: ${node.metadata.id}`);
			continue;
		}
		if (isAreaNode(node)) {
			warnings.push(
				`Nested Area node was not extracted as an area table row: ${node.metadata.id}`,
			);
			continue;
		}
		compositesById.set(node.metadata.id, nodeToComposite(node));
		composites.push({ kind: "composite", id: node.metadata.id });
	}

	return composites;
}

function getAreaId(node: WireframeNode) {
	const areaCode = node.props?.areaCode;
	return typeof areaCode === "string" && areaCode.length > 0
		? areaCode
		: node.metadata.id;
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

