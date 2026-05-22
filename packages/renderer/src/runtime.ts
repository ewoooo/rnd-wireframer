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
	| "area"
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

const DEFAULT_KIND_MAPPINGS: Array<[string, WireframeNodeKind]> = [
	["HeaderBase", "header"],
	["Layout.Flex", "layout-flex"],
	["Layout.Grid", "layout-grid"],
	["PageStack", "page-stack"],
	["Divider", "divider"],
	["SectionHeader", "section-header"],
	["Area", "area"],
	["ListCell", "list-cell"],
	["Accordion", "accordion"],
	["SectionMessage", "section-message"],
	["TextField", "text-field"],
	["Button", "action"],
	["ActionButton", "action"],
	["ActionArea", "action"],
];

const kindByType = new Map<string, WireframeNodeKind>(DEFAULT_KIND_MAPPINGS);

export function registerWireframeNodeKinds(
	mappings: Array<{ type: string; kind: WireframeNodeKind }>,
): void {
	for (const { type, kind } of mappings) {
		kindByType.set(type, kind);
	}
}

export function clearWireframeNodeKindRegistry(): void {
	kindByType.clear();
	for (const [type, kind] of DEFAULT_KIND_MAPPINGS) {
		kindByType.set(type, kind);
	}
}

export function getWireframeNodeKind(node: WireframeNode): WireframeNodeKind {
	return kindByType.get(node.type) ?? "fallback";
}
