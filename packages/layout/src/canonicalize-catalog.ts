import { layoutAlias } from "./catalog.alias";
import { layoutCatalog } from "./catalog.generated";
import * as layoutRegistry from "./registry.generated";

// alias 무결성: 모든 catalog id가 alias 키에 있고, 모든 alias 값이 registry의 실제 component export여야 한다.
// 모듈 로드 시 1회 검증(external canonicalize-catalog와 동일 패턴).
export function assertAliasIntegrity(): void {
	const missingAlias = Object.keys(layoutCatalog).filter((id) => !(id in layoutAlias));
	if (missingAlias.length > 0) {
		throw new Error(`catalog.alias: catalog id에 대한 alias 누락: ${missingAlias.join(", ")}`);
	}

	const registry = layoutRegistry as Record<string, unknown>;
	const danglingTargets = Object.entries(layoutAlias)
		.filter(([, componentKey]) => typeof registry[componentKey] !== "function")
		.map(([id, componentKey]) => `${id}->${componentKey}`);
	if (danglingTargets.length > 0) {
		throw new Error(`catalog.alias: registry에 없는 canonical key: ${danglingTargets.join(", ")}`);
	}
}

assertAliasIntegrity();

/** layoutId → canonical componentKey. 미등록이면 undefined(경계에서 invalid 처리). */
export function canonicalizeLayout(id: string): string | undefined {
	return layoutAlias[id];
}
