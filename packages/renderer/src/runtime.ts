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
	| "organism"
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

function getWireframeNodeKind(node: WireframeNode): WireframeNodeKind {
	if (node.type === "HeaderBase") return "header";
	if (node.type === "Layout.Flex") return "layout-flex";
	if (node.type === "Layout.Grid") return "layout-grid";
	if (node.type === "PageStack") return "page-stack";
	if (node.type === "Divider") return "divider";
	if (node.type === "SectionHeader") return "section-header";
	if (node.type === "Organism") return "organism";
	if (node.type === "ListCell") return "list-cell";
	if (node.type === "Accordion") return "accordion";
	if (node.type === "SectionMessage") return "section-message";
	if (node.type === "TextField") return "text-field";
	if (node.type === "Button" || node.type === "ActionArea") return "action";
	return "fallback";
}
