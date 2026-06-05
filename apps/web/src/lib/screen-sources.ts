import type { RenderTreeScreenNode } from "@cx/renderer";

export type ScreenSummary = {
	id: string;
	title: string;
	description?: string;
	moduleId?: string;
	order?: number;
	renderTree?: RenderTreeScreenNode;
	route?: string;
	screenRouteId?: string;
	screenVariantId?: string;
	screenVariantName?: string;
	screenVariantOrder?: number;
	status?: string;
	sourcePath: string;
	type?: string;
	variantType?: string;
};
