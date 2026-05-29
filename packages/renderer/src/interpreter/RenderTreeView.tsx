"use client";

import { createRendererRuntime } from "../adapters";
import type { RenderTreeScreenNode } from "../tree/types";
import { renderScreen } from "./render-screen";
import type { RendererRuntime } from "./types";

const defaultRendererRuntime = createRendererRuntime();

export function RenderTreeView({
	data,
	node,
	runtime = defaultRendererRuntime,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeScreenNode;
	runtime?: RendererRuntime;
}) {
	return renderScreen({ data: data ?? {}, node, runtime });
}
