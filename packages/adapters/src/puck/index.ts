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
	bottom: "screen.bottom",
	contents: "screen.contents",
	header: "screen.header",
} satisfies Record<ScreenRegionType, string>;

export type PuckScreenItem = {
	props: {
		id: string;
		itemKind: ItemKind;
		nodeId: string;
		nodePropsJson?: string;
		title?: string;
		variant?: string;
	};
	type: string;
};

export type PuckScreenData = {
	content: PuckScreenItem[];
	root: {
		props: Record<string, never>;
	};
	zones: Record<string, PuckScreenItem[]>;
};

export type PuckAdapterDiagnostic = {
	code:
		| "duplicate_node"
		| "invalid_node_props_json"
		| "missing_contents_region"
		| "missing_node_id"
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
		root: { props: {} },
		zones: {
			[screenRegionZoneIds.header]: createPuckItems(header?.children ?? [], "screen-region-child"),
			[screenRegionZoneIds.contents]: createPuckItems(
				contents?.children ?? [],
				"screen-region-child",
			),
			[screenRegionZoneIds.bottom]: createPuckItems(bottom?.children ?? [], "screen-region-child"),
		},
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
			diagnostics,
			sourceChildren,
			items: input.data.zones[screenRegionZoneIds.header] ?? [],
		}).children;
	}
	contents.children = reorderChildren({
		consumedIds,
		diagnostics,
		sourceChildren,
		items: input.data.zones[screenRegionZoneIds.contents] ?? input.data.content,
	}).children;
	if (bottom) {
		bottom.children = reorderChildren({
			consumedIds,
			diagnostics,
			sourceChildren,
			items: input.data.zones[screenRegionZoneIds.bottom] ?? [],
		}).children;
	}

	return {
		diagnostics,
		node: screen,
	};
}

export function applyPuckAreaData(input: {
	area: RenderTreeNodeContract;
	data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeNodeContract> {
	const area = cloneNode(input.area);
	const result = reorderChildren({
		children: area.children ?? [],
		items: input.data.content,
	});
	area.children = result.children;

	return {
		diagnostics: result.diagnostics,
		node: area,
	};
}

export function applyPuckComponentData(input: {
	component: RenderTreeNodeContract;
	data: PuckScreenData;
}): ApplyPuckDataResult<RenderTreeNodeContract> {
	const component = cloneNode(input.component);
	if (!component.children?.length) {
		const result = reorderChildren({
			children: [component],
			items: input.data.content,
		});
		return {
			diagnostics: result.diagnostics,
			node: result.children[0] ?? component,
		};
	}

	const result = reorderChildren({
		children: component.children,
		items: input.data.content,
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
	consumedIds?: Set<string>;
	diagnostics?: PuckAdapterDiagnostic[];
	items: PuckScreenItem[];
	sourceChildren?: RenderTreeNodeContract[];
}): {
	children: RenderTreeNodeContract[];
	diagnostics: PuckAdapterDiagnostic[];
} {
	const diagnostics = input.diagnostics ?? [];
	const childById = new Map(
		(input.sourceChildren ?? input.children ?? []).map((child) => [child.metadata.id, child]),
	);
	const consumedIds = input.consumedIds ?? new Set<string>();
	const nextChildren: RenderTreeNodeContract[] = [];

	for (const item of input.items) {
		const nodeId = item.props.nodeId;
		if (!nodeId) {
			diagnostics.push({ code: "missing_node_id", severity: "error" });
			continue;
		}
		if (consumedIds.has(nodeId)) {
			diagnostics.push({ code: "duplicate_node", id: nodeId, severity: "warning" });
			continue;
		}

		const child = childById.get(nodeId);
		if (!child) {
			diagnostics.push({ code: "unknown_node", id: nodeId, severity: "warning" });
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
