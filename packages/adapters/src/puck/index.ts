import {
	RENDER_TREE_NODE_TYPE,
	type RenderTreeNodeContract,
	type RenderTreeScreenNodeContract,
} from "@cx/schema";
import type {
	RenderAreaChildRow,
	RenderComponentChildRow,
	RenderScreenRegionChildRow,
} from "../table/types";

export type ItemKind = "screen-region-child" | "area-child" | "component-child";
export type ScreenRegionType = "header" | "contents" | "bottom";

export const screenRegionZoneIds = {
	bottom: "root:screen.bottom",
	contents: "root:screen.contents",
	header: "root:screen.header",
} satisfies Record<ScreenRegionType, string>;

export const screenRegionSlotNames = {
	bottom: "bottom",
	contents: "contents",
	header: "header",
} as const satisfies Record<ScreenRegionType, ScreenRegionType>;

export type PuckScreenItem = {
	props: {
		[propName: string]: unknown;
		id: string;
		itemKind: ItemKind;
		nodeId: string;
		nodePropsJson?: string;
		title?: string;
		variant?: string;
	};
	type: string;
};

export type PuckCatalogItem = {
	componentVersion?: string;
	defaultChildren?: RenderTreeNodeContract[];
	defaultProps?: RenderTreeNodeContract["props"];
	nodeId?: string;
	nodeType: string;
	puckType: string;
	title: string;
};

export type PuckScreenData = {
	content: PuckScreenItem[];
	root: {
		props: Partial<Record<ScreenRegionType, PuckScreenItem[]>>;
	};
	zones: Record<string, PuckScreenItem[]>;
};

export type PuckAdapterDiagnostic = {
	code:
		| "duplicate_node"
		| "invalid_node_props_json"
		| "missing_contents_region"
		| "missing_node_id"
		| "unknown_catalog_item"
		| "unknown_node";
	id?: string;
	severity: "error" | "warning";
};

export type ApplyPuckDataResult<TNode extends RenderTreeNodeContract> = {
	diagnostics: PuckAdapterDiagnostic[];
	node: TNode;
};

export function renderTreeToPuckScreenData(
	input:
		| RenderTreeScreenNodeContract
		| {
				screen: RenderTreeScreenNodeContract;
				screenRegionChildren?: RenderScreenRegionChildRow[];
		  },
): PuckScreenData {
	const screen = "screen" in input ? input.screen : input;
	const header = findScreenRegion(screen, RENDER_TREE_NODE_TYPE.screenHeader);
	const contents = findScreenRegion(screen, RENDER_TREE_NODE_TYPE.screenContents);
	const bottom = findScreenRegion(screen, RENDER_TREE_NODE_TYPE.screenBottom);

	return {
		content: [],
		root: {
			props: {
				[screenRegionSlotNames.header]: createPuckItems(
					header?.children ?? [],
					"screen-region-child",
				),
				[screenRegionSlotNames.contents]: createPuckItems(
					contents?.children ?? [],
					"screen-region-child",
				),
				[screenRegionSlotNames.bottom]: createPuckItems(
					bottom?.children ?? [],
					"screen-region-child",
				),
			},
		},
		zones: {},
	};
}

export function renderTreeToPuckAreaData(
	input:
		| RenderTreeNodeContract
		| {
				area: RenderTreeNodeContract;
				areaChildren?: RenderAreaChildRow[];
		  },
): PuckScreenData {
	const area = "area" in input ? input.area : input;
	return createPuckData({
		children: area.children ?? [],
		itemKind: "area-child",
	});
}

export function renderTreeToPuckComponentData(input: {
	component: RenderTreeNodeContract;
	componentChildren?: RenderComponentChildRow[];
}): PuckScreenData {
	const componentChildren = input.component.children ?? [input.component];
	return createPuckData({
		children: componentChildren,
		itemKind: "component-child",
	});
}

export function applyPuckScreenData(input: {
	catalogItems?: PuckCatalogItem[];
	data: PuckScreenData;
	screen: RenderTreeScreenNodeContract;
}): ApplyPuckDataResult<RenderTreeScreenNodeContract> {
	const screen = cloneScreenNode(input.screen);
	const header = findScreenRegion(screen, RENDER_TREE_NODE_TYPE.screenHeader);
	const contents = findScreenRegion(screen, RENDER_TREE_NODE_TYPE.screenContents);
	const bottom = findScreenRegion(screen, RENDER_TREE_NODE_TYPE.screenBottom);

	if (!contents) {
		return {
			diagnostics: [{ code: "missing_contents_region", severity: "error" }],
			node: screen,
		};
	}

	const diagnostics: PuckAdapterDiagnostic[] = [];
	const consumedIds = new Set<string>();
	const sourceChildren = screen.children.flatMap((region) => region.children ?? []);
	if (header) {
		header.children = reorderChildren({
			consumedIds,
			catalogItems: input.catalogItems,
			diagnostics,
			sourceChildren,
			items: readScreenRegionItems(input.data, "header"),
		}).children;
	}
	contents.children = reorderChildren({
		consumedIds,
		catalogItems: input.catalogItems,
		diagnostics,
		sourceChildren,
		items: readScreenRegionItems(input.data, "contents", input.data.content),
	}).children;
	if (bottom) {
		bottom.children = reorderChildren({
			consumedIds,
			catalogItems: input.catalogItems,
			diagnostics,
			sourceChildren,
			items: readScreenRegionItems(input.data, "bottom"),
		}).children;
	}

	return {
		diagnostics,
		node: screen,
	};
}

function readScreenRegionItems(
	data: PuckScreenData,
	region: ScreenRegionType,
	fallback: PuckScreenItem[] = [],
) {
	return (
		data.root.props[screenRegionSlotNames[region]] ??
		data.zones[screenRegionZoneIds[region]] ??
		fallback
	);
}

export function applyPuckAreaData(input: {
	area: RenderTreeNodeContract;
	catalogItems?: PuckCatalogItem[];
	data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeNodeContract> {
	const area = cloneNode(input.area);
	const result = reorderChildren({
		catalogItems: input.catalogItems,
		children: area.children ?? [],
		items: input.data.content,
		nodeIdPolicy: "allow-duplicates",
	});
	area.children = result.children;

	return {
		diagnostics: result.diagnostics,
		node: area,
	};
}

export function applyPuckComponentData(input: {
	catalogItems?: PuckCatalogItem[];
	component: RenderTreeNodeContract;
	data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeNodeContract> {
	const component = cloneNode(input.component);
	if (!component.children?.length) {
		const result = reorderChildren({
			catalogItems: input.catalogItems,
			children: [component],
			items: input.data.content,
			nodeIdPolicy: "allow-duplicates",
		});
		return {
			diagnostics: result.diagnostics,
			node: result.children[0] ?? component,
		};
	}

	const result = reorderChildren({
		catalogItems: input.catalogItems,
		children: component.children,
		items: input.data.content,
		nodeIdPolicy: "allow-duplicates",
	});
	component.children = result.children;

	return {
		diagnostics: result.diagnostics,
		node: component,
	};
}

export function puckScreenDataToRenderTree(input: {
	data: PuckScreenData;
	screen: RenderTreeScreenNodeContract;
}): RenderTreeScreenNodeContract {
	return applyPuckScreenData(input).node;
}

export function puckAreaDataToRenderTree(input: {
	area: RenderTreeNodeContract;
	data: PuckScreenData;
}): RenderTreeNodeContract {
	return applyPuckAreaData(input).node;
}

export function puckComponentDataToRenderTree(input: {
	component: RenderTreeNodeContract;
	data: PuckScreenData;
}): RenderTreeNodeContract {
	return applyPuckComponentData(input).node;
}

function createPuckData(input: {
	children: RenderTreeNodeContract[];
	itemKind: ItemKind;
}): PuckScreenData {
	return {
		content: createPuckItems(input.children, input.itemKind),
		root: { props: {} },
		zones: {},
	};
}

function createPuckItems(children: RenderTreeNodeContract[], itemKind: ItemKind): PuckScreenItem[] {
	return children.map((child) => {
		const props: PuckScreenItem["props"] = {
			...readEditableNodeProps(child.props),
			id: child.metadata.id,
			itemKind,
			nodeId: child.metadata.id,
			nodePropsJson: stringifyNodeProps(child.props),
			title: child.metadata.title,
		};
		return {
			type: child.metadata.id,
			props,
		};
	});
}

function findScreenRegion(screen: RenderTreeScreenNodeContract, type: string) {
	return screen.children.find((child) => child.type === type);
}

function reorderChildren(input: {
	children?: RenderTreeNodeContract[];
	catalogItems?: PuckCatalogItem[];
	consumedIds?: Set<string>;
	diagnostics?: PuckAdapterDiagnostic[];
	items: PuckScreenItem[];
	nodeIdPolicy?: "allow-duplicates" | "reject-duplicates";
	sourceChildren?: RenderTreeNodeContract[];
}): {
	children: RenderTreeNodeContract[];
	diagnostics: PuckAdapterDiagnostic[];
} {
	const diagnostics = input.diagnostics ?? [];
	const childById = new Map(
		(input.sourceChildren ?? input.children ?? []).map((child) => [child.metadata.id, child]),
	);
	const catalogByPuckType = new Map(
		(input.catalogItems ?? []).map((item) => [item.puckType, item]),
	);
	const consumedIds = input.consumedIds ?? new Set<string>();
	const nodeIdPolicy = input.nodeIdPolicy ?? "reject-duplicates";
	const nextChildren: RenderTreeNodeContract[] = [];

	for (const item of input.items) {
		const nodeId = item.props.nodeId;
		if (!nodeId) {
			diagnostics.push({ code: "missing_node_id", severity: "error" });
			continue;
		}
		if (nodeIdPolicy === "reject-duplicates" && consumedIds.has(nodeId)) {
			diagnostics.push({ code: "duplicate_node", id: nodeId, severity: "warning" });
			continue;
		}

		const child = childById.get(nodeId);
		if (!child) {
			const catalogItem = catalogByPuckType.get(item.type);
			if (!catalogItem) {
				diagnostics.push({ code: "unknown_node", id: nodeId, severity: "warning" });
				continue;
			}
			const nextChild = applyPuckItemToNode(
				createMountedNode(catalogItem, item),
				item,
				diagnostics,
			);
			consumedIds.add(nextChild.metadata.id);
			nextChildren.push(nextChild);
			continue;
		}

		consumedIds.add(nodeId);
		const nextChild = applyPuckItemToNode(child, item, diagnostics);
		nextChildren.push(nextChild);
	}

	return {
		children: nextChildren,
		diagnostics,
	};
}

function createMountedNode(
	catalogItem: PuckCatalogItem,
	item: PuckScreenItem,
): RenderTreeNodeContract {
	const idSource = item.props.nodeId || catalogItem.nodeId || item.props.id || catalogItem.puckType;
	return {
		children: catalogItem.defaultChildren?.map(cloneNode),
		componentVersion: catalogItem.componentVersion ?? "1.0.0",
		metadata: {
			id: idSource.startsWith("tmp:") ? idSource : `tmp:${idSource}`,
			title: item.props.title ?? catalogItem.title,
		},
		props: catalogItem.defaultProps ? cloneJsonValue(catalogItem.defaultProps) : undefined,
		type: catalogItem.nodeType,
	};
}

function applyPuckItemToNode(
	node: RenderTreeNodeContract,
	item: PuckScreenItem,
	diagnostics: PuckAdapterDiagnostic[],
): RenderTreeNodeContract {
	const nextNode = cloneNode(node);
	nextNode.metadata = {
		...nextNode.metadata,
		title: item.props.title ?? nextNode.metadata.title,
	};

	if (item.props.nodePropsJson !== undefined) {
		const parsedProps = parseNodeProps(item.props.nodePropsJson);
		if (parsedProps.ok) {
			nextNode.props = parsedProps.value;
		} else {
			diagnostics.push({
				code: "invalid_node_props_json",
				id: item.props.nodeId,
				severity: "error",
			});
		}
	}
	const typedProps = readTypedFieldProps(item.props);
	if (typedProps) {
		nextNode.props = {
			...(nextNode.props ?? {}),
			...typedProps,
		};
	}

	return nextNode;
}

function cloneScreenNode(screen: RenderTreeScreenNodeContract): RenderTreeScreenNodeContract {
	return cloneNode(screen) as RenderTreeScreenNodeContract;
}

function cloneNode(node: RenderTreeNodeContract): RenderTreeNodeContract {
	return {
		...node,
		children: node.children?.map(cloneNode),
		display: node.display ? cloneJsonValue(node.display) : undefined,
		metadata: { ...node.metadata },
		props: node.props ? cloneJsonValue(node.props) : undefined,
	};
}

function cloneJsonValue<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function stringifyNodeProps(props: RenderTreeNodeContract["props"]): string {
	if (!props) return "{}";
	return JSON.stringify(props, null, 2);
}

function parseNodeProps(value: string):
	| {
			ok: true;
			value: RenderTreeNodeContract["props"];
	  }
	| {
			ok: false;
	  } {
	try {
		const parsed = JSON.parse(value) as unknown;
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return { ok: false };
		}
		return { ok: true, value: parsed as RenderTreeNodeContract["props"] };
	} catch {
		return { ok: false };
	}
}

function readEditableNodeProps(props: RenderTreeNodeContract["props"]): Record<string, unknown> {
	if (!props) return {};
	const editableProps = { ...props };
	for (const key of puckReservedPropNames) {
		delete editableProps[key];
	}
	return editableProps;
}

function readTypedFieldProps(
	props: PuckScreenItem["props"],
): RenderTreeNodeContract["props"] | undefined {
	const typedProps: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(props)) {
		if (puckReservedPropNames.has(key) || value === undefined) continue;
		typedProps[key] = value;
	}
	if (Object.keys(typedProps).length === 0) return undefined;
	return typedProps as RenderTreeNodeContract["props"];
}

const puckReservedPropNames = new Set(["id", "itemKind", "nodeId", "nodePropsJson", "title"]);
