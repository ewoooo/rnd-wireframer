import type { LayoutCatalogMeta } from "../../catalog-types";

export const meta: LayoutCatalogMeta = {
	id: "layout.composite.compositeCouponBenefitCard",
	target: "composite",
	name: "쿠폰 혜택 카드",
	props: {
		componentGaps: {
			type: "array",
		},
		gap: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
	},
	description: "Coupon Figma layer를 실제 Coupon surface로 배치하는 혜택 카드 composite",
	status: "stable",
};
