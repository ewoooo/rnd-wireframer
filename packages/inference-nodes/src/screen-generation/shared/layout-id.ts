import { RENDER_TREE_NODE_TYPE } from "@cx/schema";

type LayoutTarget = "area" | "composite" | "region" | "screen";

/**
 * Builds a layout id from a target and kebab/lower id: layout.<target>.<camelName>.
 * Single source for the kebab→camel layout-id convention shared by candidate builders,
 * the repair node, and the fake runner.
 */
export function toLayoutId(target: LayoutTarget, id: string): string {
	return `layout.${target}.${id.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())}`;
}

/**
 * Canonical region layout id per Screen region node type. Keys are derived from
 * @cx/schema's RENDER_TREE_NODE_TYPE so the region literals stay single-sourced.
 */
const REGION_LAYOUT_ID_BY_TYPE = {
	[RENDER_TREE_NODE_TYPE.screenHeader]: toLayoutId("region", "header"),
	[RENDER_TREE_NODE_TYPE.screenContents]: toLayoutId("region", "contents"),
	[RENDER_TREE_NODE_TYPE.screenBottom]: toLayoutId("region", "bottom"),
} as const satisfies Record<string, string>;

export type ScreenRegionNodeType = keyof typeof REGION_LAYOUT_ID_BY_TYPE;

/**
 * Returns the canonical region layout id when `type` is a Screen region node type,
 * otherwise undefined. Used by the repair node to fill missing region layouts.
 */
export function regionLayoutIdForType(type: unknown): string | undefined {
	if (typeof type !== "string") return undefined;
	return (REGION_LAYOUT_ID_BY_TYPE as Record<string, string>)[type];
}
