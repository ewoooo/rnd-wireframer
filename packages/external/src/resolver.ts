import {
	type ComponentCatalogEntry,
	type ComponentCatalogObject,
	type ComponentCatalogStatus,
	SSOT_OBJECT_SCHEMA_VERSION,
} from "@cx/schema";
import { externalCatalog } from "./catalog.generated";
import { textPropSourceKeys } from "./catalog.text-sources";

export const componentCatalog = externalCatalog;

// 텍스트 소스 테이블의 모든 키가 실제 catalog 엔트리 prop 키인지 모듈 로드 시 검증한다.
export function assertTextPropSourceIntegrity(): void {
	const knownPropKeys = new Set(
		Object.values(externalCatalog).flatMap((entry) => Object.keys(entry.props)),
	);
	const dead = Object.keys(textPropSourceKeys).filter((key) => !knownPropKeys.has(key));
	if (dead.length > 0) {
		throw new Error(
			`catalog.text-sources.ts: 다음 키가 catalog의 어떤 엔트리 prop에도 없음 → ${dead.join(", ")}`,
		);
	}
}

assertTextPropSourceIntegrity();

/** texts 컨테이너에서 prop 값을 찾을 때 시도할 source key 순서. 미등록 prop은 자기 자신만. */
export function getTextPropSourceKeys(key: string): readonly string[] {
	return textPropSourceKeys[key] ?? [key];
}

export function getComponentCatalogEntry(type: string): ComponentCatalogEntry | undefined {
	return externalCatalog[type];
}

export function getComponentCatalogTypes(): string[] {
	return Object.keys(externalCatalog).sort();
}

/** source(barrel/draft)에서 status(stable/candidate)를 유도한다. */
export function getComponentCatalogStatus(type: string): ComponentCatalogStatus | undefined {
	const entry = getComponentCatalogEntry(type);
	if (!entry) return undefined;
	return entry.source === "kiki-barrel" ? "stable" : "candidate";
}

/** candidate = kiki-draft 엔트리. */
export function listCandidateComponentEntries(): ComponentCatalogEntry[] {
	return Object.values(externalCatalog).filter((entry) => entry.source === "kiki-draft");
}

export function resolveComponentCatalogForInference(): ComponentCatalogObject {
	return {
		kind: "component-catalog",
		id: "default",
		owner: "@cx/external",
		sourceRef: "catalog",
		version: "v1",
		schemaVersion: SSOT_OBJECT_SCHEMA_VERSION,
		data: {
			entries: Object.values(externalCatalog),
		},
	};
}
