import { isRecord } from "@cx/schema";

export type IssuePath = Array<string | number>;

type TreeVisitor = (
	node: Record<string, unknown>,
	path: IssuePath,
	ancestors: Array<Record<string, unknown>>,
) => void;

/**
 * RenderTree 모양(children 재귀)을 깊이 우선으로 순회한다.
 * rule들이 각자 재귀를 재구현하지 않도록 하는 공용 순회기.
 */
export function walkTree(
	node: unknown,
	visit: TreeVisitor,
	path: IssuePath = [],
	ancestors: Array<Record<string, unknown>> = [],
): void {
	if (Array.isArray(node)) {
		node.forEach((child, index) => {
			walkTree(child, visit, [...path, index], ancestors);
		});
		return;
	}
	if (!isRecord(node)) return;

	visit(node, path, ancestors);

	if (Array.isArray(node.children)) {
		node.children.forEach((child, index) => {
			walkTree(child, visit, [...path, "children", index], [...ancestors, node]);
		});
	}
}

/**
 * metadata.id → 노드(+발견 경로) 인덱스. source-prop-mismatch처럼
 * SourceSpec ref와 RenderTree 노드를 교차 비교하는 rule이 사용한다.
 */
export function collectRenderNodesByMetadataId(
	input: unknown,
	path: IssuePath = [],
	nodes = new Map<string, Record<string, unknown> & { path?: IssuePath }>(),
): Map<string, Record<string, unknown> & { path?: IssuePath }> {
	if (Array.isArray(input)) {
		input.forEach((child, index) => {
			collectRenderNodesByMetadataId(child, [...path, index], nodes);
		});
		return nodes;
	}
	if (!isRecord(input)) return nodes;
	const metadata = isRecord(input.metadata) ? input.metadata : undefined;
	if (typeof metadata?.id === "string" && metadata.id.length > 0) {
		nodes.set(metadata.id, { ...input, path });
	}
	if (Array.isArray(input.children)) {
		input.children.forEach((child, index) => {
			collectRenderNodesByMetadataId(child, [...path, "children", index], nodes);
		});
	}
	return nodes;
}
