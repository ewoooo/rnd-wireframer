import type { ReactNode } from "react";
import type { RenderableTreeNode, RenderTreeNodeKind } from "./runtime";
import type { RenderTreeNode } from "./schema";

export interface RenderTreeRenderContext {
	data: Record<string, unknown>;
	node: RenderTreeNode;
	renderable: RenderableTreeNode;
	renderChildren: () => ReactNode;
}

export type RenderTreeRenderer = (context: RenderTreeRenderContext) => ReactNode;

export interface RendererDefinition {
	kind: RenderTreeNodeKind;
	render: RenderTreeRenderer;
}

export class RendererRegistry {
	private renderers = new Map<RenderTreeNodeKind, RenderTreeRenderer>();

	register(definition: RendererDefinition): void {
		this.renderers.set(definition.kind, definition.render);
	}

	registerAll(definitions: RendererDefinition[]): void {
		for (const definition of definitions) {
			this.register(definition);
		}
	}

	get(kind: RenderTreeNodeKind): RenderTreeRenderer | undefined {
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
