import type { RendererDefinition } from "../../registry";
import { areaDynamicRendererDefinition } from "./dynamic";
import { areaStaticRendererDefinition } from "./static";

/**
 * 정규 area kind 두 개. type → kind 매핑은 runtime.ts의 EXTRA_KIND_MAPPINGS:
 *   "area.static"  → "area.static"  (이 정의)
 *   "area.dynamic" → "area.dynamic" (이 정의)
 */
export const areaRendererDefinitions: RendererDefinition[] = [
	areaStaticRendererDefinition,
	areaDynamicRendererDefinition,
];

export { areaStaticRendererDefinition, areaDynamicRendererDefinition };
