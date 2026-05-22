/**
 * Area 렌더링 분기에 필요한 타입.
 *
 * errorPolicy 값은 PRDD 문서의 한국어 문자열을 그대로 사용한다 — 데이터와
 * 코드 어휘를 1:1로 유지해 가시성을 높인다. 다른 포맷 만나면 그때 정규화.
 */

export const ERROR_POLICY = {
	HIDE_AREA: "영역 전체 숨김",
	HIDE_ITEM: "오류 항목 미노출",
	SHOW_DEFAULT: "기본값 표시",
} as const;

export type ErrorPolicy = (typeof ERROR_POLICY)[keyof typeof ERROR_POLICY];

export type AreaType = "static" | "dynamic";

export interface AreaRenderableProps {
	name?: string;
	titleGap?: number;
	componentGap?: number;
	areaType?: AreaType;
	errorPolicy?: string;
	visibility?: string;
	minCount?: number;
	maxCount?: number;
}
