import type { RenderTreeNode } from "@cx/renderer";
import type { ScreenSummary } from "@/lib/screen-sources";

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

const moduleNamesById: Record<string, string> = {
	mbr: "MBR",
	preview: "Preview",
};

const moduleSortOrderById: Record<string, number> = {
	preview: 0,
	mbr: 1,
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

export function collectScreenComponents(screen?: ScreenSummary): RenderTreeNode[] {
	return screen?.renderTree ? collectLeafComponents(screen.renderTree) : [];
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
			name: getModuleName(moduleId),
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
				getModuleSortOrder(left.id) - getModuleSortOrder(right.id) ||
				left.name.localeCompare(right.name),
		);
}

function getModuleName(moduleId: string) {
	return moduleNamesById[moduleId] ?? moduleId;
}

function getModuleSortOrder(moduleId?: string) {
	return moduleSortOrderById[moduleId ?? ""] ?? Number.MAX_SAFE_INTEGER;
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

function collectLeafComponents(node: RenderTreeNode): RenderTreeNode[] {
	if (!node.children?.length && !node.type.startsWith("Screen.") && node.type !== "Screen") {
		return [node];
	}
	return node.children?.flatMap((child) => collectLeafComponents(child)) ?? [];
}
