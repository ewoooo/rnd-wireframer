import type { RenderTreeNode } from "@cx/renderer";
import { getScreenModuleName, getScreenModuleSortOrder } from "@/lib/screen-module";
import type { ScreenSummary } from "@/lib/screen-sources";
import { buildExternalComponentCatalog } from "@/model/external-palette";

export type NavigatorTab = "agent" | "comp" | "ogn" | "puck" | "scn";

export type ScreenRouteGroup = {
	id: string;
	moduleId?: string;
	name: string;
	screenCount: number;
	variants: ScreenVariantGroup[];
};

export type ScreenModuleGroup = {
	id: string;
	name: string;
	routes: ScreenRouteGroup[];
};

export type ScreenVariantGroup = {
	id: string;
	name: string;
	options: ScreenVariantOption[];
	order: number;
};

export type ScreenVariantOption = {
	label: string;
	screen: ScreenSummary;
};

export type WorkbenchViewModel = {
	screenModules: ScreenModuleGroup[];
	screenRoutes: ScreenRouteGroup[];
};

export type NavigationNodeItem = {
	childCount: number;
	id: string;
	layout?: string;
	screenId?: string;
	screenTitle?: string;
	title: string;
	type: string;
};

export type NavigationNodeEntry = {
	node: RenderTreeNode;
	screen: ScreenSummary;
};

export function createWorkbenchViewModel(screens: ScreenSummary[]): WorkbenchViewModel {
	const screenRoutes = buildScreenRouteGroups(screens);

	return {
		screenModules: buildScreenModuleGroups(screenRoutes),
		screenRoutes,
	};
}

export function getInitialScreen(screens: ScreenSummary[]) {
	return screens[0];
}

export function collectScreenAreas(screen?: ScreenSummary): RenderTreeNode[] {
	return screen?.renderTree ? collectNodesByTypePrefix(screen.renderTree, "area.") : [];
}

export function collectWorkbenchAreas(screens: ScreenSummary[]): NavigationNodeEntry[] {
	return screens.flatMap((screen) =>
		collectScreenAreas(screen).map((node) => ({
			node,
			screen,
		})),
	);
}

// cmp 탭은 스크린 트리의 인스턴스가 아니라 로컬 @cx/external 카탈로그를 보여준다.
// (sync:catalog 산출물이라 정적 → import 시 1회 변환.)
const externalComponentNodes = Array.from(buildExternalComponentCatalog().values());

export function listExternalComponents(): RenderTreeNode[] {
	return externalComponentNodes;
}

export function toCatalogNavigationItems(nodes: RenderTreeNode[]): NavigationNodeItem[] {
	return nodes.map((node) => ({
		childCount: node.children?.length ?? 0,
		id: node.metadata.id,
		layout: node.layout,
		title: node.metadata.title,
		type: node.type,
	}));
}

export function toNavigationNodeItems(entries: NavigationNodeEntry[]): NavigationNodeItem[] {
	return entries.map(({ node, screen }) => ({
		childCount: node.children?.length ?? 0,
		id: node.metadata.id,
		layout: node.layout,
		screenId: screen.id,
		screenTitle: screen.title,
		title: node.metadata.title,
		type: node.type,
	}));
}

export function getScreenOptionLabel(screen: ScreenSummary) {
	if (screen.title === screen.screenVariantName) return "기본";
	const prefix = `${screen.screenVariantName}-`;
	if (screen.screenVariantName && screen.title.startsWith(prefix)) {
		return screen.title.slice(prefix.length).trim();
	}
	return screen.id.split("-").at(-1) ?? screen.title;
}

function buildScreenRouteGroups(screens: ScreenSummary[]): ScreenRouteGroup[] {
	const routes = new Map<string, ScreenRouteGroup>();

	for (const screen of screens) {
		const routeId = screen.screenRouteId ?? "unknown-route";
		const route = routes.get(routeId) ?? {
			id: routeId,
			moduleId: screen.moduleId,
			name: screen.route ?? "Unknown route",
			screenCount: 0,
			variants: [],
		};
		const variantId = screen.screenVariantId ?? screen.id;
		let variant = route.variants.find((candidate) => candidate.id === variantId);

		if (!variant) {
			variant = {
				id: variantId,
				name: screen.screenVariantName ?? screen.title,
				options: [],
				order: screen.screenVariantOrder ?? route.variants.length + 1,
			};
			route.variants.push(variant);
		}

		variant.options.push({
			label: getScreenOptionLabel(screen),
			screen,
		});
		route.screenCount += 1;
		routes.set(routeId, route);
	}

	return Array.from(routes.values()).map((route) => ({
		...route,
		variants: route.variants
			.map((variant) => ({
				...variant,
				options: [...variant.options].sort(compareScreenOptions),
			}))
			.sort((left, right) => left.order - right.order || left.name.localeCompare(right.name)),
	}));
}

function buildScreenModuleGroups(routes: ScreenRouteGroup[]): ScreenModuleGroup[] {
	const modules = new Map<string, ScreenModuleGroup>();

	for (const route of routes) {
		const moduleId = route.moduleId ?? "local";
		const module: ScreenModuleGroup = modules.get(moduleId) ?? {
			id: moduleId,
			name: getScreenModuleName(moduleId),
			routes: [],
		};
		module.routes.push(route);
		modules.set(moduleId, module);
	}

	return Array.from(modules.values())
		.map((module) => ({
			...module,
			routes: [...module.routes].sort((left, right) => left.name.localeCompare(right.name)),
		}))
		.sort(
			(left, right) =>
				getScreenModuleSortOrder(left.id) - getScreenModuleSortOrder(right.id) ||
				left.name.localeCompare(right.name),
		);
}

function compareScreenOptions(left: ScreenVariantOption, right: ScreenVariantOption) {
	return (
		(left.screen.order ?? Number.MAX_SAFE_INTEGER) -
			(right.screen.order ?? Number.MAX_SAFE_INTEGER) ||
		left.screen.id.localeCompare(right.screen.id)
	);
}

function collectNodesByTypePrefix(node: RenderTreeNode, prefix: string): RenderTreeNode[] {
	const current = node.type.startsWith(prefix) ? [node] : [];
	const children = node.children?.flatMap((child) => collectNodesByTypePrefix(child, prefix)) ?? [];
	return [...current, ...children];
}
