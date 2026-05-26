export const NODE_TYPES = {
	screenSurface: ["screen.page", "screen.bottomSheet", "screen.popup"],
	screenRoot: ["Screen"],
	screenRegion: ["Screen.Header", "Screen.Contents", "Screen.Bottom"],
	layout: ["Layout.Flex", "Layout.Grid", "PageStack"],
	system: ["MissingReference"],
	area: ["area.static", "area.dynamic"],
} as const satisfies Record<string, readonly string[]>;

export type ScreenSurfaceType = (typeof NODE_TYPES.screenSurface)[number];
export type ScreenRootType = (typeof NODE_TYPES.screenRoot)[number];
export type ScreenRegionType = (typeof NODE_TYPES.screenRegion)[number];
export type LayoutType = (typeof NODE_TYPES.layout)[number];
export type SystemType = (typeof NODE_TYPES.system)[number];
export type AreaType = (typeof NODE_TYPES.area)[number];

export type NodeTypeFamily =
	| "screen-surface"
	| "screen-root"
	| "screen-region"
	| "layout"
	| "system"
	| "area"
	| "component";

const FAMILY_BY_NODE_TYPE: Record<string, Exclude<NodeTypeFamily, "component">> = {
	...fromFamily("screen-surface", NODE_TYPES.screenSurface),
	...fromFamily("screen-root", NODE_TYPES.screenRoot),
	...fromFamily("screen-region", NODE_TYPES.screenRegion),
	...fromFamily("layout", NODE_TYPES.layout),
	...fromFamily("system", NODE_TYPES.system),
	...fromFamily("area", NODE_TYPES.area),
};

function fromFamily<F extends Exclude<NodeTypeFamily, "component">>(
	family: F,
	types: readonly string[],
): Record<string, F> {
	return Object.fromEntries(types.map((type) => [type, family])) as Record<string, F>;
}

export function getNodeTypeFamily(type: string): NodeTypeFamily {
	return FAMILY_BY_NODE_TYPE[type] ?? "component";
}

export const BUILT_IN_NODE_TYPES: ReadonlySet<string> = new Set(Object.keys(FAMILY_BY_NODE_TYPE));

export function isBuiltInNodeType(type: string): boolean {
	return BUILT_IN_NODE_TYPES.has(type);
}

export function isScreenSurfaceType(type: string): type is ScreenSurfaceType {
	return FAMILY_BY_NODE_TYPE[type] === "screen-surface";
}

export function isScreenRootType(type: string): type is ScreenRootType {
	return FAMILY_BY_NODE_TYPE[type] === "screen-root";
}

export function isScreenRegionType(type: string): type is ScreenRegionType {
	return FAMILY_BY_NODE_TYPE[type] === "screen-region";
}

export function isLayoutType(type: string): type is LayoutType {
	return FAMILY_BY_NODE_TYPE[type] === "layout";
}

export function isSystemType(type: string): type is SystemType {
	return FAMILY_BY_NODE_TYPE[type] === "system";
}

export function isAreaType(type: string): type is AreaType {
	return FAMILY_BY_NODE_TYPE[type] === "area";
}
