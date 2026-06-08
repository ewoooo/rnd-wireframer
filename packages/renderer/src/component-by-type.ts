import type { ComponentType } from "react";
import * as ComponentsModule from "@cx/components";
import { componentCatalogAliases } from "@cx/components/catalog";
// [KIKI-SHIM] import 소스 "/registry" 가 임시 — kiki 빌드 제공 시 "@cx/external"(빌드 barrel)로 변경.
// 가이드: packages/external/KIKI-SHIM.md. (kiki를 등록하는 아래 로직 자체는 영구.)
// 공식 barrel(@cx/external)이 아니라 registry(전체 표면)를 쓴다 — draft 컴포넌트까지 렌더 가능해야 한다.
import * as ExternalModule from "@cx/external/registry";

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

// kiki 컴포넌트: "kiki.Button" 형태로 등록
for (const [name, value] of Object.entries(ExternalModule)) {
	if (typeof value === "function") {
		componentsByType[`kiki.${name}`] = value as ComponentType<unknown>;
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
