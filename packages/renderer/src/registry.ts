import type { ReactNode } from "react";
import type { RenderableWireframeNode, WireframeNodeKind } from "./runtime";
import type { WireframeNode } from "./schema";

export interface WireframeRenderContext {
	data: Record<string, unknown>;
	node: WireframeNode;
	renderable: RenderableWireframeNode;
	renderChildren: () => ReactNode;
}

export type WireframeRenderer = (context: WireframeRenderContext) => ReactNode;

export interface RendererDefinition {
	kind: WireframeNodeKind;
	render: WireframeRenderer;
}

export class RendererRegistry {
	private renderers = new Map<WireframeNodeKind, WireframeRenderer>();

	register(definition: RendererDefinition): void {
		this.renderers.set(definition.kind, definition.render);
	}

	registerAll(definitions: RendererDefinition[]): void {
		for (const definition of definitions) {
			this.register(definition);
		}
	}

	get(kind: WireframeNodeKind): WireframeRenderer | undefined {
		return this.renderers.get(kind);
	}

	has(kind: WireframeNodeKind): boolean {
		return this.renderers.has(kind);
	}

	getKinds(): WireframeNodeKind[] {
		return Array.from(this.renderers.keys()).sort();
	}

	clear(): void {
		this.renderers.clear();
	}
}
