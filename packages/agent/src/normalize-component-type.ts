/**
 * Component type alias 정규화. Compose / Materialize 단계가 공통으로 사용.
 *
 * 현재 단일 규칙: "action-area" (kebab) → "button" (lowercase).
 * 새 alias 추가 시 이 표만 갱신.
 */
const TYPE_ALIASES: Record<string, string> = {
	"action-area": "button",
};

export function normalizeComponentType(type: string | undefined): string | undefined {
	if (!type) return type;
	const key = type.toLowerCase();
	return TYPE_ALIASES[key] ?? type;
}
