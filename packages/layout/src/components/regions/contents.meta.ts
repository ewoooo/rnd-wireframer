import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta = {
	id: "layout.region.contents",
	target: "region",
	name: "콘텐츠 리전",
	description:
		"Screen.Contents 전용 표준 rail. Region 자체는 spacing을 소유하지 않고 area layout이 내부 간격을 담당한다.",
	props: {},
	children: {
		accepts: "area-or-component",
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
