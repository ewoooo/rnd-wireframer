import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta = {
	id: "layout.region.header",
	target: "region",
	name: "헤더 리전",
	description: "Screen.Header 전용 표준 rail. Header children을 순서대로 세로 배치한다.",
	props: {},
	children: {
		accepts: "area-or-component",
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
