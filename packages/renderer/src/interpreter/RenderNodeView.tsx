"use client";

import { createRendererRuntime } from "../adapters";
import type { RenderTreeNode } from "../tree/types";
import { renderJsonNode } from "./render-node";
import type { RendererRuntime } from "./types";

const defaultRendererRuntime = createRendererRuntime();

export function RenderNodeView({
	data,
	node,
	runtime = defaultRendererRuntime,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeNode;
	runtime?: RendererRuntime;
}) {
	return renderJsonNode(node, data ?? {}, runtime);
}
