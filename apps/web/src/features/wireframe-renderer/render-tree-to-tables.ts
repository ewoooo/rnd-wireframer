import type { PropValue, WireframeNode, WireframeSchema, WireframeScreenNode } from "@cx/renderer";

import type {
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
	screenVariantCode: string;
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
	schema: WireframeSchema,
	options: RenderTreeToTablesOptions,
): RenderTreeToTablesResult {
	const warnings: string[] = [];
	const screenNode = getSingleScreenNode(schema, warnings);
	const compositesById = new Map<string, WireframeNode>();
	const organismsById = new Map<string, SampleOrganism>();

	const screen: SampleScreen = {
		id: options.screenId ?? schema.metadata.id,
		order: options.order,
		screenVariantCode: options.screenVariantCode,
		version: schema.version,
		minRendererVersion: schema.minRendererVersion,
		metadata: schema.metadata,
		pattern: options.pattern,
		theme: schema.theme,
		data: schema.data,
		screen: {
			type: "Screen",
			componentVersion: screenNode.componentVersion,
			metadata: screenNode.metadata,
			props: screenNode.props,
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
	compositesById: Map<string, WireframeNode>,
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
		metadata: region.metadata,
		props: region.props,
		children: extractRegionEntries(region.children ?? [], compositesById, organismsById, warnings),
	};
}

function extractRegionEntries(
	nodes: WireframeNode[],
	compositesById: Map<string, WireframeNode>,
	organismsById: Map<string, SampleOrganism>,
	warnings: string[],
): SampleRenderEntry[] {
	return nodes.flatMap((node) => extractRegionEntry(node, compositesById, organismsById, warnings));
}

function extractRegionEntry(
	node: WireframeNode,
	compositesById: Map<string, WireframeNode>,
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

	if (node.type === "Organism") {
		const organismId = getOrganismId(node);
		organismsById.set(organismId, extractOrganism(node, organismId, compositesById, warnings));
		return [{ kind: "organism", organismId }];
	}

	compositesById.set(node.metadata.id, cloneNode(node));
	return [{ kind: "composite", compositeId: node.metadata.id }];
}

function extractOrganism(
	node: WireframeNode,
	organismId: string,
	compositesById: Map<string, WireframeNode>,
	warnings: string[],
): SampleOrganism {
	if (!node.props || !("organismCode" in node.props)) {
		warnings.push(`Organism node ${node.metadata.id} is missing props.organismCode`);
	}

	const { organismCode: _organismCode, ...props } = node.props ?? {};

	return {
		id: organismId,
		type: "Organism",
		componentVersion: node.componentVersion,
		metadata: node.metadata,
		props: Object.keys(props).length > 0 ? (props as Record<string, PropValue>) : undefined,
		composites: extractOrganismComposites(node.children ?? [], compositesById, warnings),
	};
}

function extractOrganismComposites(
	nodes: WireframeNode[],
	compositesById: Map<string, WireframeNode>,
	warnings: string[],
) {
	const composites: SampleOrganism["composites"] = [];

	for (const node of nodes) {
		if (isGeneratedPageStack(node)) {
			composites.push(...extractOrganismComposites(node.children ?? [], compositesById, warnings));
			continue;
		}
		if (isGeneratedDivider(node)) {
			warnings.push(`Dropped generated divider wrapper: ${node.metadata.id}`);
			continue;
		}
		if (node.type === "Organism") {
			warnings.push(
				`Nested Organism node was not extracted as an organism table row: ${node.metadata.id}`,
			);
			continue;
		}
		compositesById.set(node.metadata.id, cloneNode(node));
		composites.push({ compositeId: node.metadata.id, order: composites.length + 1 });
	}

	return composites;
}

function getOrganismId(node: WireframeNode) {
	const organismCode = node.props?.organismCode;
	return typeof organismCode === "string" && organismCode.length > 0
		? organismCode
		: node.metadata.id;
}

function isGeneratedPageStack(node: WireframeNode) {
	return node.type === "PageStack";
}

function isGeneratedDivider(node: WireframeNode) {
	return node.type === "Divider" && /-divider-\d+$/.test(node.metadata.id);
}

function cloneNode(node: WireframeNode): WireframeNode {
	return JSON.parse(JSON.stringify(node)) as WireframeNode;
}
