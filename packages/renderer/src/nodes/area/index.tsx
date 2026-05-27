import type { NodeRendererDefinition } from "../../registry/node-renderer-registry";
import { dynamicAreaNodeRenderer } from "./dynamic";
import { staticAreaNodeRenderer } from "./static";

/**
 * 정규 area kind 두 개. type → kind 매핑은 registry/kind-map의 계약 테이블:
 *   "area.static"  → "area.static"  (이 정의)
 *   "area.dynamic" → "area.dynamic" (이 정의)
 */
export const areaNodeRenderers: NodeRendererDefinition[] = [
	staticAreaNodeRenderer,
	dynamicAreaNodeRenderer,
];

export { dynamicAreaNodeRenderer, staticAreaNodeRenderer };
