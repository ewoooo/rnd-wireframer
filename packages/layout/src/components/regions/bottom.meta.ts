import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta = {
	id: "layout.region.bottom",
	target: "region",
	name: "하단 리전",
	description:
		"Screen.Bottom 전용 표준 rail. Region 자체는 padding, gap, safe area를 소유하지 않고 하단 action area가 이를 담당한다.",
	props: {},
	children: {
		accepts: "area-or-component",
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
