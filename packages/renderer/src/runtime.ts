import { resolveDisplayWhen, resolveProps } from "./bindings";
import type { WireframeNode, WireframeScreenNode } from "./schema";

export type WireframeNodeKind =
	| "accordion"
	| "action"
	| "divider"
	| "fallback"
	| "header"
	| "layout-flex"
	| "layout-grid"
	| "list-cell"
	| "area.static"
	| "area.dynamic"
	| "page-stack"
	| "section-header"
	| "section-message"
	| "text-field";

export interface RenderableWireframeNode {
	kind: WireframeNodeKind;
	node: WireframeNode;
	props: Record<string, unknown>;
}

export function getScreenRegions(node: WireframeScreenNode) {
	const [headerNode, contentsNode, bottomNode] = node.children;

	return {
		bottomNode,
		contentsNode,
		headerNode,
	};
}

export function getRenderableWireframeNode(
	node: WireframeNode,
	data: Record<string, unknown>,
): RenderableWireframeNode | undefined {
	if (!resolveDisplayWhen(node.display?.when, data)) return undefined;

	return {
		kind: getWireframeNodeKind(node),
		node,
		props: resolveProps(node.props, data),
	};
}

export function toText(value: unknown, fallback = "") {
	if (value === undefined || value === null) return fallback;
	return String(value);
}

export function toBoolean(value: unknown, fallback = false) {
	if (value === undefined || value === null) return fallback;
	return Boolean(value);
}

import { componentCatalog, componentCatalogAliases, type ComponentCatalogEntry } from "./component-catalog";

// Catalog 외 layout primitive / Area 등 카탈로그에 없는 type은 여기서 추가.
const EXTRA_KIND_MAPPINGS: Array<[string, WireframeNodeKind]> = [
	["Layout.Flex", "layout-flex"],
	["Layout.Grid", "layout-grid"],
	["PageStack", "page-stack"],
	["area.static", "area.static"],
	["area.dynamic", "area.dynamic"],
	["Accordion", "accordion"],
	["accordion", "accordion"],
	["ActionArea", "action"],
	["action-area", "action"],
];

const kindByType = new Map<string, WireframeNodeKind>(EXTRA_KIND_MAPPINGS);

// Catalog의 kind 필드를 자동 등록 (alias 포함)
for (const entry of Object.values(componentCatalog) as ComponentCatalogEntry[]) {
	if (!entry.kind) continue;
	kindByType.set(entry.type, entry.kind);
	for (const alias of entry.aliases ?? []) {
		kindByType.set(alias, entry.kind);
	}
}
// Alias 맵에 정의된 추가 alias도 흡수
for (const [alias, type] of Object.entries(componentCatalogAliases)) {
	const entry = (componentCatalog as Record<string, ComponentCatalogEntry>)[type];
	if (entry?.kind && !kindByType.has(alias)) kindByType.set(alias, entry.kind);
}

export function getWireframeNodeKind(node: WireframeNode): WireframeNodeKind {
	return kindByType.get(node.type) ?? "fallback";
}
