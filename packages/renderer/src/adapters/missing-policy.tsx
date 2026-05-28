import type { ReactNode } from "react";
import type { RenderTreeNode } from "../tree/types";

export type MissingLayoutHandler = (input: {
	layoutId: string;
	node: RenderTreeNode;
}) => ReactNode;

export type MissingComponentHandler = (input: { node: RenderTreeNode }) => ReactNode;

export type MissingPrimitiveHandler = (input: { node: RenderTreeNode }) => ReactNode;

export function throwMissingLayout({
	layoutId,
	node,
}: {
	layoutId: string;
	node: RenderTreeNode;
}): never {
	throw new Error(
		`Unknown layout pattern '${layoutId}' for node '${node.metadata.id}' (${node.type})`,
	);
}

export function throwMissingComponent({ node }: { node: RenderTreeNode }): never {
	throw new Error(`Unknown component type '${node.type}' for node '${node.metadata.id}'`);
}

export function throwMissingPrimitive({ node }: { node: RenderTreeNode }): never {
	throw new Error(`Unknown primitive type '${node.type}' for node '${node.metadata.id}'`);
}
