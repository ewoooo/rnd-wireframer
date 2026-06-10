import type { LayoutCatalogMeta } from "../../../catalog-types";

export const meta = {
	id: "layout.area.authCodeEntry",
	target: "area",
	name: "인증번호 입력",
	description:
		"인증번호 입력 필드, 남은 시간 표시, 오류/만료 메시지, 재요청 보조 액션을 세로로 배치하는 인증 요청 area 패턴",
	props: {
		componentGap: {
			type: "number",
		},
		gap: {
			type: "number",
		},
		titleGap: {
			type: "number",
		},
		sectionModel: {
			type: "string",
		},
		primaryActionPlacement: {
			type: "string",
		},
		secondaryActionPlacement: {
			type: "string",
		},
		divider: {
			type: "enum",
			values: ["contents", "none", "section"],
		},
		itemPaddingX: {
			type: "number",
		},
		itemTemplate: {
			type: "enum",
			values: ["card-0", "default-20", "plain"],
		},
		paddingX: {
			type: "number",
		},
		paddingY: {
			type: "number",
		},
		sectionGap: {
			type: "number",
		},
		sectionPaddingX: {
			type: "number",
		},
		slotInsetX: {
			type: "number",
		},
	},
	children: {
		accepts: "component",
		min: 1,
	},
	status: "stable",
} as const satisfies LayoutCatalogMeta;
