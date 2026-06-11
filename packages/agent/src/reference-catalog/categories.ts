// category → @cx/agent 패키지 기준 docs 디렉토리(상대). sync 스크립트와 런타임이 공유하는 단일 진실원.
// 새 category 추가 = 여기 한 줄 + 디렉토리 생성 + 정답지 작성.
export const REFERENCE_CATEGORIES = {
	area: "docs/references/areas",
	screen: "docs/references/screens",
} as const;

export type ReferenceCategory = keyof typeof REFERENCE_CATEGORIES;

export function isReferenceCategory(value: string): value is ReferenceCategory {
	return value in REFERENCE_CATEGORIES;
}
