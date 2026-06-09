import { layoutAliasIndex } from "./layout-alias";

const QUALIFIED_LAYOUT_ID = /^layout\.(screen|region|area|composite)\.[A-Za-z0-9][A-Za-z0-9.-]*$/;

/**
 * 입력 layout id를 canonical qualified id로 확정한다. write-back/register 경계에서 한 번만 호출.
 * 이미 qualified면 그대로, 명시적 alias면 매핑값, 그 외에는 undefined(경계에서 invalid 처리).
 * camel→kebab, prefix strip 같은 fuzzy 변환은 하지 않는다 — resolve-on-read 안티패턴 방지.
 */
export function canonicalizeLayoutId(raw: string): string | undefined {
	if (QUALIFIED_LAYOUT_ID.test(raw)) return raw;
	return layoutAliasIndex[raw];
}
