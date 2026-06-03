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
	zones: Record<string, never>;
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
	const contents = findScreenContents(screen);

	return createPuckData({
		children: contents?.children ?? [],
		itemKind: "screen-region-child",
	});
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
	const contents = findScreenContents(screen);

	if (!contents) {
		return {
			diagnostics: [{ code: "missing_contents_region", severity: "error" }],
			node: screen,
		};
	}

	const result = reorderChildren({
		children: contents.children,
		items: input.data.content,
	});
	contents.children = result.children;

	return {
		diagnostics: result.diagnostics,
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
		content: input.children.map((child) => {
			const props: PuckScreenItem["props"] = {
				id: child.metadata.id,
				itemKind: input.itemKind,
				nodeId: child.metadata.id,
				nodePropsJson: stringifyNodeProps(child.props),
				title: child.metadata.title,
			};
			return {
				type: child.metadata.id,
				props,
			};
		}),
		root: { props: {} },
		zones: {},
	};
}

function findScreenContents(screen: RenderTreeScreenNodeContract) {
	return screen.children.find((child) => child.type === RENDER_TREE_NODE_TYPE.screenContents);
}

function reorderChildren(input: { children: RenderTreeNodeContract[]; items: PuckScreenItem[] }): {
	children: RenderTreeNodeContract[];
	diagnostics: PuckAdapterDiagnostic[];
} {
	const diagnostics: PuckAdapterDiagnostic[] = [];
	const childById = new Map(input.children.map((child) => [child.metadata.id, child]));
	const consumedIds = new Set<string>();
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
