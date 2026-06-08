import { externalCatalog } from "@cx/external/catalog";
import type { RenderTreeNode } from "@cx/renderer";
import type { ComponentCatalogEntry, ComponentPropContract } from "@cx/types/component-catalog";
import type { PropValue } from "@cx/types/database-tables";

// vendored 서드파티(kiki) 카탈로그는 동기화 시점에 고정되므로 메타 타임스탬프도 고정값을 쓴다.
// (실시간 생성이 아니라 sync 산출물이라 createdAt/updatedAt이 의미를 갖지 않는다.)
const SYNC_TIMESTAMP = "2026-06-08T00:00:00.000Z";

// externalCatalog(@cx/external) 엔트리를 area 팔레트가 요구하는 RenderTreeNode로 변환한다.
// renderer는 이미 `kiki.*` type을 getComponentForType으로 해소하므로, 노드만 만들면
// 팔레트 표시·드래그 insert·캔버스 렌더가 모두 동작한다.
export function buildExternalComponentCatalog(): Map<string, RenderTreeNode> {
	const byId = new Map<string, RenderTreeNode>();
	for (const [type, entry] of Object.entries(externalCatalog)) {
		byId.set(type, toRenderTreeNode(type, entry));
	}
	return byId;
}

function toRenderTreeNode(type: string, entry: ComponentCatalogEntry): RenderTreeNode {
	return {
		type,
		componentVersion: entry.version,
		metadata: {
			id: type,
			title: entry.label ?? type,
			author: "kiki-sync",
			createdAt: SYNC_TIMESTAMP,
			updatedAt: SYNC_TIMESTAMP,
			description: entry.description,
		},
		props: buildDefaultProps(entry.props, type.replace(/^kiki\./, "")),
	};
}

// required prop이 빈 값으로 렌더돼 깨져 보이지 않도록 contract에서 합리적 기본값을 채운다.
// 선택(optional) prop은 생략해 노드를 가볍게 유지한다.
// displayName: required node 슬롯(주로 children)에 넣을 placeholder 텍스트.
function buildDefaultProps(
	props: ComponentCatalogEntry["props"],
	displayName: string,
): Record<string, PropValue> {
	const result: Record<string, PropValue> = {};
	for (const [name, contract] of Object.entries(props)) {
		const value = defaultPropValue(name, contract, displayName);
		if (value !== undefined) result[name] = value;
	}
	return result;
}

function defaultPropValue(
	name: string,
	contract: ComponentPropContract,
	displayName: string,
): PropValue | undefined {
	if (contract.defaultValue !== undefined) return contract.defaultValue as PropValue;
	if (contract.type === "enum" && contract.values?.length) return contract.values[0];
	if (!contract.required) return undefined;

	switch (contract.type) {
		case "string":
			return humanize(name);
		case "number":
			return 0;
		case "boolean":
			return false;
		case "array":
			return [];
		case "node":
			// required node 슬롯(children 등)에 컴포넌트 이름을 placeholder 텍스트로 — 빈 채로 안 보이지 않게.
			return displayName;
		default:
			return undefined;
	}
}

function humanize(name: string): string {
	const spaced = name
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_-]+/g, " ")
		.trim();
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
