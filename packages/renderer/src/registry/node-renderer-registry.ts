import type { ReactNode } from "react";
import type { RenderTreeNodeKind, ResolvedRenderNode } from "../tree/runtime";
import type { RenderTreeNode } from "../tree/types";

export interface NodeRenderContext {
	data: Record<string, unknown>;
	node: RenderTreeNode;
	renderable: ResolvedRenderNode;
	renderChildren: () => ReactNode;
}

export type NodeRenderer = (context: NodeRenderContext) => ReactNode;

export interface NodeRendererDefinition {
	kind: RenderTreeNodeKind;
	render: NodeRenderer;
}

export class NodeRendererRegistry {
	private renderers = new Map<RenderTreeNodeKind, NodeRenderer>();

	register(definition: NodeRendererDefinition): void {
		this.renderers.set(definition.kind, definition.render);
	}

	registerAll(definitions: NodeRendererDefinition[]): void {
		for (const definition of definitions) {
			this.register(definition);
		}
	}

	get(kind: RenderTreeNodeKind): NodeRenderer | undefined {
		return this.renderers.get(kind);
	}

	has(kind: RenderTreeNodeKind): boolean {
		return this.renderers.has(kind);
	}

	getKinds(): RenderTreeNodeKind[] {
		return Array.from(this.renderers.keys()).sort();
	}

	clear(): void {
		this.renderers.clear();
	}
}
