import type { PropValue, RenderTreeNode, RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import { type AreaType, isAreaType } from "@cx/types/node-types";

import type {
	SampleArea,
	SampleAreaSet,
	SampleComposite,
	SampleCompositeSet,
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
	schema: RenderTree,
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
			type: "page",
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

function getSingleScreenNode(schema: RenderTree, warnings: string[]): RenderTreeScreenNode {
	const screenNodes = schema.children.filter((node) => node.type === "Screen");
	if (screenNodes.length === 0) {
		throw new Error("RenderTree must include a Screen node");
	}
	if (screenNodes.length > 1) {
		warnings.push("Multiple Screen nodes found; only the first Screen node was extracted");
	}
	return screenNodes[0] as RenderTreeScreenNode;
}

function extractRegion(
	screenNode: RenderTreeScreenNode,
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
	nodes: RenderTreeNode[],
	compositesById: Map<string, SampleComposite>,
	areasById: Map<string, SampleArea>,
	warnings: string[],
): SampleRenderEntry[] {
	return nodes.flatMap((node) => extractRegionEntry(node, compositesById, areasById, warnings));
}

function extractRegionEntry(
	node: RenderTreeNode,
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

	if (isAreaType(node.type)) {
		const areaId = getAreaId(node);
		areasById.set(areaId, extractArea(node, areaId, compositesById, warnings));
		return [{ kind: "area", id: areaId }];
	}

	compositesById.set(node.metadata.id, nodeToComposite(node));
	return [{ kind: "component", id: node.metadata.id }];
}

function extractArea(
	node: RenderTreeNode,
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
		type: (isAreaType(node.type) ? node.type : "area.static") as AreaType,
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

function nodeToComposite(node: RenderTreeNode): SampleComposite {
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
	nodes: RenderTreeNode[],
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
		if (isAreaType(node.type)) {
			warnings.push(
				`Nested area node was not extracted as an area table row: ${node.metadata.id}`,
			);
			continue;
		}
		compositesById.set(node.metadata.id, nodeToComposite(node));
		composites.push({ kind: "component", id: node.metadata.id });
	}

	return composites;
}

function getAreaId(node: RenderTreeNode) {
	const areaCode = node.props?.areaCode;
	return typeof areaCode === "string" && areaCode.length > 0
		? areaCode
		: node.metadata.id;
}

// area 카탈로그 노드(organisms 기반)의 자식들을 organisms.children 포맷
// ({kind:"component", id}[]) 으로 직렬화한다. area 페이지 저장에서 사용.
// children 의 순서/구성만 뽑으며 component 행 자체는 건드리지 않는다
// (nodeToComposite 는 손실 변환이므로 components 테이블 갱신에는 쓰지 않는다).
export function areaNodeToChildren(node: RenderTreeNode): SampleArea["children"] {
	const warnings: string[] = [];
	const throwawayComposites = new Map<string, SampleComposite>();
	return extractAreaChildren(node.children ?? [], throwawayComposites, warnings);
}

function isGeneratedPageStack(node: RenderTreeNode) {
	return node.type === "PageStack";
}

function isGeneratedDivider(node: RenderTreeNode) {
	return node.type === "Divider" && /-divider-\d+$/.test(node.metadata.id);
}

