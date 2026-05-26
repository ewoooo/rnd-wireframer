/**
 * Design token vocabulary.
 *
 * ComponentPropContract.tokenRole / ComponentCatalogEntry.tokens 가 이 어휘를 사용한다.
 * 새 role을 추가할 때는 반드시 @cx/tokens 의 실제 스케일과 매핑 가능한 어휘로만 둔다.
 */

export const TOKEN_ROLES = [
	// 수치 스케일
	"spacing",
	"radius",
	"elevation",
	"size.icon",
	"size.avatar",

	// 색 — surface
	"color.surface",
	"color.surface.brand",
	"color.surface.inverse",
	"color.surface.elevated",
	"color.surface.muted",

	// 색 — text
	"color.text",
	"color.text.brand",
	"color.text.inverse",
	"color.text.muted",
	"color.text.error",

	// 색 — border
	"color.border",
	"color.border.subtle",
	"color.border.strong",

	// 색 — icon
	"color.icon",
	"color.icon.brand",
	"color.icon.muted",

	// 타이포그래피 (semantic role)
	"typography.title",
	"typography.subtitle",
	"typography.body",
	"typography.caption",
	"typography.label",

	// 모션
	"motion.duration",
	"motion.easing",
] as const;

export type TokenRole = (typeof TOKEN_ROLES)[number];

export const TOKEN_ROLE_SET: ReadonlySet<string> = new Set(TOKEN_ROLES);

export function isTokenRole(value: string): value is TokenRole {
	return TOKEN_ROLE_SET.has(value);
}

/**
 * Token slot — 컴포넌트의 어느 표면에 token이 붙는지.
 * ComponentCatalogEntry.tokens 가 이 슬롯별로 TokenRole을 선언한다.
 */
export const TOKEN_SLOTS = ["surface", "text", "border", "icon", "shadow"] as const;
export type TokenSlot = (typeof TOKEN_SLOTS)[number];

/**
 * Spacing token scale. @cx/tokens Tailwind spacing key와 같다.
 * tokenRole: "spacing" 인 prop의 값은 이 집합 안이어야 한다.
 */
export const SPACING_TOKEN_VALUES: readonly number[] = [
	0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40,
];

export const SPACING_TOKEN_SET: ReadonlySet<number> = new Set(SPACING_TOKEN_VALUES);

/**
 * Radius token scale. @cx/tokens radius key와 같다.
 * 초안 — 실제 @cx/tokens 스케일 확정 시 동기화한다.
 */
export const RADIUS_TOKEN_VALUES: readonly number[] = [0, 4, 8, 12, 16, 24, 9999];
export const RADIUS_TOKEN_SET: ReadonlySet<number> = new Set(RADIUS_TOKEN_VALUES);

/**
 * Elevation level scale. shadow level.
 */
export const ELEVATION_TOKEN_VALUES: readonly number[] = [0, 1, 2, 3, 4];
export const ELEVATION_TOKEN_SET: ReadonlySet<number> = new Set(ELEVATION_TOKEN_VALUES);

/**
 * Numeric token role의 허용 스케일을 조회한다.
 * 비수치 token role(color/typography/motion)에는 undefined를 반환한다.
 */
export function getNumericTokenScale(role: TokenRole): ReadonlySet<number> | undefined {
	switch (role) {
		case "spacing":
			return SPACING_TOKEN_SET;
		case "radius":
			return RADIUS_TOKEN_SET;
		case "elevation":
			return ELEVATION_TOKEN_SET;
		default:
			return undefined;
	}
}
