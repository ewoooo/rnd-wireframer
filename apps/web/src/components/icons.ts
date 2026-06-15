import {
	Blocks,
	Copy,
	Layers,
	LayoutTemplate,
	type LucideIcon,
	Map,
	Palette,
	Pencil,
	RectangleHorizontal,
	RefreshCw,
	Route,
	SlidersHorizontal,
	Smartphone,
	Table2,
	Trash2,
} from "lucide-react";

/**
 * 아이콘 단일 매핑 — "의미(텍스트) ↔ lucide 아이콘".
 *
 * 사용처(Rail, 패널 헤더, 리스트 등)에서 직접 lucide를 import하지 말고
 * 여기 키로 가져다 쓴다 → 아이콘 교체가 한 곳에서 끝난다.
 *
 * 계층(아래로 갈수록 하위·밀도 낮음): domain ▸ route ▸ screen ▸ area ▸ component
 *   - domain: 1:1 대응 아이콘이 없어 route의 상위격이라는 의미로 `map`.
 *   - component: area의 하위라 일부러 밀도 낮은 아이콘(흔한 Figma 컴포넌트 아이콘 X) `rectangle-horizontal`.
 *   - run: 사용자가 정한 게 아닌 예외 규칙 (잠정 `table-2`).
 */

export const ICONS = {
	run: Table2, // ⚠️ 예외 — 확정 아님, 잠정값
	domain: Map,
	route: Route,
	screen: Smartphone,
	area: LayoutTemplate,
	component: RectangleHorizontal,
	// 패널 기능 아이콘
	layers: Layers,
	properties: SlidersHorizontal, // 확정
	// 리스트 행 액션 (cmp 수정/복제/삭제) — 수정·복제는 추후 개발 전까지 비활성
	edit: Pencil,
	duplicate: Copy,
	delete: Trash2,
	sync: RefreshCw, // 카탈로그 동기화(kiki→@cx/external)
	// 우하단(하위 요소 불러오기)은 현재 페이지의 *하위 타입* 아이콘을 쓴다:
	//   screen→area, area→component, component→rawValue.
	rawValue: Palette, // component의 하위 = raw value 층위(컴포넌트화 안 된 실제 값, 최후순위 구현)
	blocks: Blocks, // (보존) 일반 blocks 아이콘 — 현재 우하단은 하위 타입 아이콘 사용
} satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICONS;
