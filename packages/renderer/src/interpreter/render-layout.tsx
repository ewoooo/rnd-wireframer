import type { ReactNode } from "react";
import type { RenderTreeNode } from "../tree/types";
import type { RendererRuntime } from "./types";

export function renderLayout({
	children,
	layoutId,
	node,
	props,
	runtime,
}: {
	children: ReactNode;
	layoutId: string;
	node: RenderTreeNode;
	props: Record<string, unknown>;
	runtime: RendererRuntime;
}): ReactNode {
	const resolvedLayout = runtime.resolveLayout({ layoutId, props });
	if (!resolvedLayout) return runtime.onMissingLayout({ layoutId, node });

	const { Component, componentProps } = resolvedLayout;
	return (
		<Component
			key={node.metadata.id}
			{...componentProps}
			className={node.className}
			metadata={node.metadata}
		>
			{children}
		</Component>
	);
}
