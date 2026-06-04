import type { RenderTreeNode, RenderTreeScreenNode } from "@cx/renderer";
import { RENDER_TREE_NODE_TYPE } from "@cx/schema";
import type { NavigatorTab } from "@/model/workbench-view-model";

export type ScreenRegionType = "header" | "contents" | "bottom";

export type EditScope =
	| {
			kind: "screen-region";
			regionType: ScreenRegionType;
			screen: RenderTreeScreenNode;
	  }
	| {
			area: RenderTreeNode;
			kind: "area";
			screen: RenderTreeScreenNode;
	  }
	| {
			component: RenderTreeNode;
			kind: "component";
			screen: RenderTreeScreenNode;
	  };

export type EditScopeInput = {
	activeTab: NavigatorTab;
	selectedArea?: RenderTreeNode;
	selectedComponent?: RenderTreeNode;
	selectedScreen?: RenderTreeScreenNode;
};

type EditScopeKind = EditScope["kind"];

const editScopeKindByTab: Partial<Record<NavigatorTab, EditScopeKind>> = {
	comp: "component",
	ogn: "area",
	puck: "screen-region",
	scn: "screen-region",
};

const defaultRegionByTab: Partial<Record<NavigatorTab, ScreenRegionType>> = {
	puck: "contents",
	scn: "contents",
};

const screenRegionNodeTypeByRegion = {
	bottom: RENDER_TREE_NODE_TYPE.screenBottom,
	contents: RENDER_TREE_NODE_TYPE.screenContents,
	header: RENDER_TREE_NODE_TYPE.screenHeader,
} satisfies Record<ScreenRegionType, string>;

export function resolveEditScope(input: EditScopeInput): EditScope | undefined {
	if (!input.selectedScreen) return undefined;

	const scopeKind = editScopeKindByTab[input.activeTab];
	if (scopeKind === "screen-region") {
		return {
			kind: scopeKind,
			regionType: defaultRegionByTab[input.activeTab] ?? "contents",
			screen: input.selectedScreen,
		};
	}

	if (scopeKind === "area" && input.selectedArea) {
		return {
			area: input.selectedArea,
			kind: scopeKind,
			screen: input.selectedScreen,
		};
	}

	if (scopeKind === "component" && input.selectedComponent) {
		return {
			component: input.selectedComponent,
			kind: scopeKind,
			screen: input.selectedScreen,
		};
	}

	return undefined;
}

export function readEditScopeTitle(scope?: EditScope) {
	if (!scope) return "Edit";
	if (scope.kind === "screen-region") return `Screen ${scope.regionType}`;
	if (scope.kind === "area") return scope.area.metadata.title;
	return scope.component.metadata.title;
}

export function isPuckEditTab(activeTab: NavigatorTab) {
	return activeTab in editScopeKindByTab;
}

export function readScreenRegion(
	screen: RenderTreeScreenNode,
	regionType: ScreenRegionType,
): RenderTreeNode | undefined {
	return screen.children.find((child) => child.type === screenRegionNodeTypeByRegion[regionType]);
}
