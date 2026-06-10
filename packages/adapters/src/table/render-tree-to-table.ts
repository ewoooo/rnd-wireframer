import type {
	RenderTreeContract,
	RenderTreeNodeContract,
	RenderTreeScreenNodeContract,
	ScreenRegionKey,
	TableChildRef,
	TableGenerationArea,
	TableGenerationComponent,
	TableGenerationMetadata,
	TableGenerationRegion,
	TableGenerationResultContract,
} from "@cx/schema";
import {
	isRenderTreeAreaNode,
	RENDER_TREE_NODE_TYPE,
	SCHEMA_VERSION,
	SCREEN_REGION_TYPE_BY_NODE_TYPE,
} from "@cx/schema";

export type RenderTreeToTablesOptions = {
	screenId?: string;
	screenVariantId?: string;
};

export type RenderTreeToTablesResult = {
	tableGenerationResult: TableGenerationResultContract;
	warnings: string[];
};

export function renderTreeToTableGenerationResult(
	renderTree: RenderTreeContract,
	options: RenderTreeToTablesOptions = {},
): RenderTreeToTablesResult {
	const warnings: string[] = [];
	const screenNode = getScreenNode(renderTree, warnings);
	const areasById = new Map<string, TableGenerationArea>();
	const componentsById = new Map<string, TableGenerationComponent>();
	const screenId = options.screenId ?? screenNode.metadata.id ?? renderTree.metadata.id;

	const header = extractRegion(screenNode, "header", areasById, componentsById, warnings);
	const contents = extractRegion(screenNode, "contents", areasById, componentsById, warnings);
	const bottom = extractRegion(screenNode, "bottom", areasById, componentsById, warnings);

	return {
		tableGenerationResult: {
			areas: Array.from(areasById.values()),
			components: Array.from(componentsById.values()),
			schemaVersion: SCHEMA_VERSION.tableGenerationResult,
			screen: {
				id: screenId,
				layout: readLayout(screenNode, "layout.screen.mobileScreen", warnings),
				metadata: metadataWithTitle(screenNode.metadata),
				minRendererVersion: renderTree.minRendererVersion,
				screen: {
					regions: { bottom, contents, header },
					type: "screen.page",
				},
				screenVariantId: options.screenVariantId ?? screenId,
				version: screenNode.componentVersion,
			},
		},
		warnings,
	};
}

function getScreenNode(
	renderTree: RenderTreeContract,
	warnings: string[],
): RenderTreeScreenNodeContract {
	const screenNodes = renderTree.children.filter(
		(node) => node.type === RENDER_TREE_NODE_TYPE.screen,
	);
	if (screenNodes.length === 0) {
		throw new Error("RenderTree must include a Screen node.");
	}
	if (screenNodes.length > 1) {
		warnings.push("Multiple Screen nodes found; only the first Screen node was applied.");
	}
	return screenNodes[0] as RenderTreeScreenNodeContract;
}

function extractRegion(
	screenNode: RenderTreeScreenNodeContract,
	regionKey: ScreenRegionKey,
	areasById: Map<string, TableGenerationArea>,
	componentsById: Map<string, TableGenerationComponent>,
	warnings: string[],
): TableGenerationRegion {
	const region = screenNode.children.find(
		(child) => SCREEN_REGION_TYPE_BY_NODE_TYPE[child.type] === regionKey,
	);
	if (!region) {
		throw new Error(`Screen node must include ${regionKey} region.`);
	}

	return {
		children: extractChildren(region.children ?? [], areasById, componentsById, warnings),
		layout: readLayout(region, defaultRegionLayout(regionKey), warnings),
		metadata: { title: region.metadata.title },
		type: region.type as TableGenerationRegion["type"],
	};
}

function defaultRegionLayout(regionKey: ScreenRegionKey): string {
	if (regionKey === "header") return "layout.region.header";
	if (regionKey === "contents") return "layout.region.contents";
	return "layout.region.bottom";
}

function extractChildren(
	nodes: RenderTreeNodeContract[],
	areasById: Map<string, TableGenerationArea>,
	componentsById: Map<string, TableGenerationComponent>,
	warnings: string[],
): TableChildRef[] {
	return nodes.flatMap((node) => {
		if (isNonBaseStateNode(node)) {
			warnings.push(
				`Dropped non-base state node from default table projection: ${node.metadata.id}`,
			);
			return [];
		}

		if (isGeneratedWrapper(node)) {
			warnings.push(`Flattened generated wrapper node: ${node.metadata.id}`);
			return extractChildren(node.children ?? [], areasById, componentsById, warnings);
		}

		if (isGeneratedDivider(node)) {
			warnings.push(`Dropped generated divider node: ${node.metadata.id}`);
			return [];
		}

		if (isRenderTreeAreaNode(node)) {
			const area = nodeToArea(node, areasById, componentsById, warnings);
			areasById.set(area.id, area);
			return [{ id: area.id, kind: "area" as const }];
		}

		const component = nodeToComponent(node);
		componentsById.set(component.id, component);
		return [{ id: component.id, kind: "component" as const }];
	});
}

function nodeToArea(
	node: RenderTreeNodeContract,
	areasById: Map<string, TableGenerationArea>,
	componentsById: Map<string, TableGenerationComponent>,
	warnings: string[],
): TableGenerationArea {
	return {
		children: extractChildren(node.children ?? [], areasById, componentsById, warnings),
		id: node.metadata.id,
		layout: requireLayout(node),
		metadata: metadataWithTitle(node.metadata),
		props: node.props,
		type: node.type as TableGenerationArea["type"],
		version: node.componentVersion,
	};
}

function nodeToComponent(node: RenderTreeNodeContract): TableGenerationComponent {
	const hooks = (node as { hooks?: unknown[] }).hooks;

	return {
		children: [
			{
				component: { type: node.type },
				props: node.props,
			},
		],
		hooks,
		id: node.metadata.id,
		layout: requireLayout(node),
		metadata: metadataWithTitle(node.metadata),
		type: node.type,
		version: node.componentVersion,
	};
}

function metadataWithTitle(metadata: RenderTreeNodeContract["metadata"]): TableGenerationMetadata {
	return {
		author: metadata.author,
		createdAt: metadata.createdAt,
		title: metadata.title,
		updatedAt: metadata.updatedAt,
	};
}

function readLayout(node: RenderTreeNodeContract, fallback: string, warnings: string[]): string {
	if (node.layout) return node.layout;
	warnings.push(`Node ${node.metadata.id} is missing layout; used ${fallback}.`);
	return fallback;
}

function requireLayout(node: RenderTreeNodeContract): string {
	if (node.layout) return node.layout;
	throw new Error(`Node ${node.metadata.id} must include layout before table projection.`);
}

function isGeneratedWrapper(node: RenderTreeNodeContract) {
	return (
		node.type === RENDER_TREE_NODE_TYPE.layoutFlex ||
		node.type === RENDER_TREE_NODE_TYPE.layoutGrid ||
		node.type === RENDER_TREE_NODE_TYPE.pageStack
	);
}

function isGeneratedDivider(node: RenderTreeNodeContract) {
	return node.type === "Divider" && /-divider-\d+$/u.test(node.metadata.id);
}

function isNonBaseStateNode(node: RenderTreeNodeContract) {
	const stateRole = node.display?.stateRole;
	return Boolean(stateRole && stateRole !== "base");
}
