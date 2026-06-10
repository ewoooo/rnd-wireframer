// 손으로 유지하는 텍스트 prop → texts 컨테이너 source key 후보 매핑(앞이 우선, 키 자신이 첫 후보).
// resolver.ts의 getTextPropSourceKeys로만 소비된다. 키는 반드시 catalog 엔트리의 실제 prop 키여야 한다(무결성 검증이 강제).
export const textPropSourceKeys: Record<string, readonly string[]> = {
	description: ["description", "descriptionText", "body", "bodyText", "slot"],
	label: ["label", "labelText", "text", "main"],
	primaryText: ["primaryText", "label", "children", "text", "main"],
	rightText: ["rightText", "value"],
	subText: ["subText", "subtitle", "description"],
	subtitle: ["subtitle", "subText", "description"],
	title: ["title", "titleText", "titleLabel", "main"],
};
