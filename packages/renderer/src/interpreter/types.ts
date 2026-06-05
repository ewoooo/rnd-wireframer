import type { ComponentType, ReactNode } from "react";
import type {
	MissingComponentHandler,
	MissingLayoutHandler,
	MissingPrimitiveHandler,
} from "../adapters/missing-policy";
import type { RenderTreeNode } from "../tree/types";

export interface ResolvedLayoutComponent {
	Component: ComponentType<Record<string, unknown>>;
	componentProps: Record<string, unknown>;
}

export interface RendererRuntime {
	resolveLayout: (input: {
		layoutId: string;
		props: Record<string, unknown>;
	}) => ResolvedLayoutComponent | undefined;
	resolveComponent: (input: {
		node: RenderTreeNode;
		props: Record<string, unknown>;
	}) => ReactNode | undefined;
	renderPrimitive: (input: {
		node: RenderTreeNode;
		props: Record<string, unknown>;
		children: ReactNode;
	}) => ReactNode | undefined;
	resolveArea: (input: {
		data: Record<string, unknown>;
		node: RenderTreeNode;
		props: Record<string, unknown>;
		renderChildren: () => ReactNode;
	}) => ReactNode | undefined;
	onMissingLayout: MissingLayoutHandler;
	onMissingComponent: MissingComponentHandler;
	onMissingPrimitive: MissingPrimitiveHandler;
}
