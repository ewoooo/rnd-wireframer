import { externalCatalog } from "./catalog.generated";
import { catalogAlias } from "./catalog.alias";

// alias 맵의 모든 값이 실제 catalog 키인지 모듈 로드 시 검증한다.
export function assertAliasIntegrity(): void {
	const missing = Object.entries(catalogAlias).filter(([, canonical]) => !externalCatalog[canonical]);
	if (missing.length > 0) {
		throw new Error(
			`catalog.alias.ts: 다음 alias가 미존재 canonical을 가리킴 → ${missing
				.map(([alias, canonical]) => `${alias}→${canonical}`)
				.join(", ")}`,
		);
	}
}

assertAliasIntegrity();

/** alias면 canonical로, 아니면 입력 그대로. */
export function canonicalizeNodeType(type: string): string {
	return catalogAlias[type] ?? type;
}

type CanonicalizableNode = { type: string; children?: CanonicalizableNode[] };

/** 트리 깊이우선 워크: 각 node.type을 canonicalizeNodeType으로 치환한 새 트리를 반환(write-back). */
export function canonicalizeRenderTree<T extends CanonicalizableNode>(node: T): T {
	return {
		...node,
		type: canonicalizeNodeType(node.type),
		...(node.children ? { children: node.children.map((child) => canonicalizeRenderTree(child)) } : {}),
	};
}
