import type { PropValue, RenderTreeNode, RenderTree, RenderTreeScreenNode } from "@cx/renderer";
import { type AreaType, isAreaType } from "@cx/types/node-types";

import type {
	SampleComposite,
	SampleCompositeSet,
	SampleOrganism,
	SampleOrganismSet,
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
	organisms: SampleOrganismSet;
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
	const organismsById = new Map<string, SampleOrganism>();

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
				header: extractRegion(screenNode, "header", compositesById, organismsById, warnings),
				contents: extractRegion(screenNode, "contents", compositesById, organismsById, warnings),
				bottom: extractRegion(screenNode, "bottom", compositesById, organismsById, warnings),
			},
		},
	};

	return {
		composites: { composites: Array.from(compositesById.values()) },
		organisms: { organisms: Array.from(organismsById.values()) },
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
	organismsById: Map<string, SampleOrganism>,
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
		children: extractRegionEntries(region.children ?? [], compositesById, organismsById, warnings),
	};
}

function extractRegionEntries(
	nodes: RenderTreeNode[],
	compositesById: Map<string, SampleComposite>,
	organismsById: Map<string, SampleOrganism>,
	warnings: string[],
): SampleRenderEntry[] {
	return nodes.flatMap((node) => extractRegionEntry(node, compositesById, organismsById, warnings));
}

function extractRegionEntry(
	node: RenderTreeNode,
	compositesById: Map<string, SampleComposite>,
	organismsById: Map<string, SampleOrganism>,
	warnings: string[],
): SampleRenderEntry[] {
	if (isGeneratedPageStack(node)) {
		return extractRegionEntries(node.children ?? [], compositesById, organismsById, warnings);
	}

	if (isGeneratedDivider(node)) {
		warnings.push(`Dropped generated divider wrapper: ${node.metadata.id}`);
		return [];
	}

	if (isAreaType(node.type)) {
		const organismId = getOrganismId(node);
		organismsById.set(organismId, extractOrganism(node, organismId, compositesById, warnings));
		return [{ kind: "area", id: organismId }];
	}

	compositesById.set(node.metadata.id, nodeToComposite(node));
	return [{ kind: "component", id: node.metadata.id }];
}

function extractOrganism(
	node: RenderTreeNode,
	organismId: string,
	compositesById: Map<string, SampleComposite>,
	warnings: string[],
): SampleOrganism {
	if (!node.props || !("organismCode" in node.props)) {
		warnings.push(`Organism node ${node.metadata.id} is missing props.organismCode`);
	}

	const { organismCode: _organismCode, ...props } = node.props ?? {};

	return {
		id: organismId,
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
		children: extractOrganismChildren(node.children ?? [], compositesById, warnings),
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

function extractOrganismChildren(
	nodes: RenderTreeNode[],
	compositesById: Map<string, SampleComposite>,
	warnings: string[],
) {
	const composites: SampleOrganism["children"] = [];

	for (const node of nodes) {
		if (isGeneratedPageStack(node)) {
			composites.push(...extractOrganismChildren(node.children ?? [], compositesById, warnings));
			continue;
		}
		if (isGeneratedDivider(node)) {
			warnings.push(`Dropped generated divider wrapper: ${node.metadata.id}`);
			continue;
		}
		if (isAreaType(node.type)) {
			warnings.push(
				`Nested area node was not extracted as an organism table row: ${node.metadata.id}`,
			);
			continue;
		}
		compositesById.set(node.metadata.id, nodeToComposite(node));
		composites.push({ kind: "component", id: node.metadata.id });
	}

	return composites;
}

function getOrganismId(node: RenderTreeNode) {
	const organismCode = node.props?.organismCode;
	return typeof organismCode === "string" && organismCode.length > 0
		? organismCode
		: node.metadata.id;
}

function isGeneratedPageStack(node: RenderTreeNode) {
	return node.type === "PageStack";
}

function isGeneratedDivider(node: RenderTreeNode) {
	return node.type === "Divider" && /-divider-\d+$/.test(node.metadata.id);
}

