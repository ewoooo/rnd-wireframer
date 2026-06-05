import type { RendererDefinition } from "../../registry";
import { areaDynamicRendererDefinition } from "./dynamic";
import { areaStaticRendererDefinition } from "./static";

/**
 * 정규 area kind 두 개. type → kind 매핑은 renderer-kind-contract의 계약 테이블:
 *   "area.static"  → "area.static"  (이 정의)
 *   "area.dynamic" → "area.dynamic" (이 정의)
 */
export const areaRendererDefinitions: RendererDefinition[] = [
	areaStaticRendererDefinition,
	areaDynamicRendererDefinition,
];

export { areaDynamicRendererDefinition, areaStaticRendererDefinition };
