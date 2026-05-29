"use client";

import type { RendererRuntime } from "./types";
import { renderScreen } from "./render-screen";
import { createRendererRuntime } from "../adapters";
import type { RenderTreeScreenNode } from "../tree/types";

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
