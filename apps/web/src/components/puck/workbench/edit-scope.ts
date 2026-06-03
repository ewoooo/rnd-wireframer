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

export function resolveEditScope(input: EditScopeInput): EditScope | undefined {
	if (!input.selectedScreen) return undefined;

	if (input.activeTab === "scn" || input.activeTab === "puck") {
		return {
			kind: "screen-region",
			regionType: "contents",
			screen: input.selectedScreen,
		};
	}

	if (input.activeTab === "ogn" && input.selectedArea) {
		return {
			area: input.selectedArea,
			kind: "area",
			screen: input.selectedScreen,
		};
	}

	if (input.activeTab === "comp" && input.selectedComponent) {
		return {
			component: input.selectedComponent,
			kind: "component",
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
	return activeTab === "scn" || activeTab === "puck" || activeTab === "ogn" || activeTab === "comp";
}

export function readScreenRegion(
	screen: RenderTreeScreenNode,
	regionType: ScreenRegionType,
): RenderTreeNode | undefined {
	const typeByRegion = {
		bottom: RENDER_TREE_NODE_TYPE.screenBottom,
		contents: RENDER_TREE_NODE_TYPE.screenContents,
		header: RENDER_TREE_NODE_TYPE.screenHeader,
	} satisfies Record<ScreenRegionType, string>;

	return screen.children.find((child) => child.type === typeByRegion[regionType]);
}
