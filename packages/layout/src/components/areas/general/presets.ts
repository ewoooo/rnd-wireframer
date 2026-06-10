// general area defaults는 component-land에 둔다(page-stack presets와 동일 정책). catalog는 계약만 소유.
// canonical 컴포넌트(.tsx)와 primitive-target resolver가 공유하는 단일 진실원.
export const generalAreaPresets = {
	areaAppBar: { gap: 0 },
	areaVertical: { gap: 0 },
	bottomActionArea: { gap: 0 },
	productFooterLegal: { bottomPadding: 120, gap: 30, paddingX: 32, paddingY: 32 },
	productHeroSummary: {
		gap: 12,
		infoPaddingBottom: 16,
		infoPaddingTop: 32,
		infoPaddingX: 32,
		thumbnailHeight: 480,
	},
} as const;
