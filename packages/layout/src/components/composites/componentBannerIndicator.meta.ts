import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.componentBannerIndicator",
	target: "composite",
	name: "배너 인디케이터",
	props: {
		gap: {
			type: "number",
		},
		height: {
			type: "number",
		},
		indicator: {
			type: "boolean",
		},
		width: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description:
		"상품 상세 중간에 들어가는 단일 BannerIndicaterMedium carousel/banner component 패턴",
	status: "stable",
};
