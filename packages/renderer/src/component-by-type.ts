import type { ComponentType } from "react";
import * as ComponentsModule from "@cx/components";
import { componentCatalogAliases } from "@cx/components/catalog";

/**
 * Catalog의 component type 이름 → 실제 React 컴포넌트 함수 매핑.
 *
 * `@cx/components` exports를 그대로 인덱싱하고, catalog alias도 동일 대상으로 라우팅한다.
 * 별도 등록 코드 없이 catalog에 새 type을 추가하고 `@cx/components`에 export하면
 * 자동으로 렌더 가능. lowercase alias(예: "button" → "Button") 자동 해소.
 */
const componentsByType: Record<string, ComponentType<unknown>> = {};

for (const [name, value] of Object.entries(ComponentsModule)) {
	if (typeof value === "function") {
		componentsByType[name] = value as ComponentType<unknown>;
	}
}

export function getComponentForType(type: string): ComponentType<unknown> | undefined {
	const direct = componentsByType[type];
	if (direct) return direct;
	const aliased = componentCatalogAliases[type];
	if (aliased) return componentsByType[aliased];
	return undefined;
}

export function listAutoRenderableTypes(): string[] {
	return Object.keys(componentsByType).sort();
}
