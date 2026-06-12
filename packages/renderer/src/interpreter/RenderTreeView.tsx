"use client";

import { createRendererRuntime } from "../adapters";
import type { RenderTreeScreenNode } from "../tree/types";
import { type RenderScreenRegion, renderScreen } from "./render-screen";
import type { RendererRuntime } from "./types";

const defaultRendererRuntime = createRendererRuntime();

export function RenderTreeView({
	data,
	node,
	renderRegion,
	runtime = defaultRendererRuntime,
}: {
	data?: Record<string, unknown>;
	node: RenderTreeScreenNode;
	renderRegion?: RenderScreenRegion;
	runtime?: RendererRuntime;
}) {
	return renderScreen({ data: data ?? {}, node, renderRegion, runtime });
}
