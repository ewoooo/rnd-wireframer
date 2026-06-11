import type { JsonSchemaDocument } from "./json-schema-registry";

/**
 * Claude CLI의 `--json-schema`는 자기 재귀 $ref를 거부한다. 재귀 $defs를
 * depth-bounded 사본(name__1..name__N)으로 펼치고 최심부 self-ref를 허용
 * 스키마({})로 바꾼 변형을 만든다 — 생성 시점 제약 전용이며, 산출물 검증은
 * 원본 재귀 스키마가 계속 담당하므로 이 변형은 원본보다 느슨해도 안전하다.
 * 직접 self-recursion만 푼다. 상호 재귀는 원본을 그대로 반환한다(기존 fallback 유지).
 */
export function toStructuredOutputJsonSchema(
	schema: JsonSchemaDocument,
	maxDepth = DEFAULT_MAX_DEPTH,
): JsonSchemaDocument {
	const defs = readDefs(schema);
	if (!defs) return schema;
	const recursiveNames = Object.keys(defs).filter((name) => containsRef(defs[name], refOf(name)));
	if (recursiveNames.length === 0) return schema;

	const unrolledDefs: Record<string, unknown> = {};
	for (const [name, def] of Object.entries(defs)) {
		if (!recursiveNames.includes(name)) {
			unrolledDefs[name] = rewriteEntryRefs(def, recursiveNames);
			continue;
		}
		const otherRecursiveNames = recursiveNames.filter((other) => other !== name);
		for (let depth = 1; depth <= maxDepth; depth += 1) {
			const next = depth < maxDepth ? refOf(unrolledName(name, depth + 1)) : undefined;
			const selfRewritten = rewriteRefs(def, refOf(name), next);
			unrolledDefs[unrolledName(name, depth)] = rewriteEntryRefs(
				selfRewritten,
				otherRecursiveNames,
			);
		}
	}

	const { $defs, $id, ...rest } = schema as Record<string, unknown>;
	void $defs;
	return {
		...(rewriteEntryRefs(rest, recursiveNames) as Record<string, unknown>),
		// 원본과 같은 ajv 인스턴스에서 컴파일돼도 충돌하지 않게 $id를 구분한다.
		...(typeof $id === "string" ? { $id: `${$id}/structured-output` } : {}),
		$defs: unrolledDefs,
	} as JsonSchemaDocument;
}

const DEFAULT_MAX_DEPTH = 6;

function unrolledName(name: string, depth: number): string {
	return `${name}__${depth}`;
}

function refOf(name: string): string {
	return `#/$defs/${name}`;
}

function readDefs(schema: JsonSchemaDocument): Record<string, unknown> | undefined {
	const defs = (schema as Record<string, unknown>).$defs;
	if (!defs || typeof defs !== "object" || Array.isArray(defs)) return undefined;
	return defs as Record<string, unknown>;
}

function containsRef(node: unknown, ref: string): boolean {
	if (Array.isArray(node)) return node.some((item) => containsRef(item, ref));
	if (!node || typeof node !== "object") return false;
	const record = node as Record<string, unknown>;
	if (record.$ref === ref) return true;
	return Object.values(record).some((value) => containsRef(value, ref));
}

/** 재귀 def 바깥의 참조는 모두 1단 사본을 가리키게 한다. */
function rewriteEntryRefs(node: unknown, recursiveNames: string[]): unknown {
	return recursiveNames.reduce(
		(current, name) => rewriteRefs(current, refOf(name), refOf(unrolledName(name, 1))),
		node,
	);
}

/** ref 일치 노드를 다음 단 사본으로 바꾸거나, 다음 단이 없으면 허용 스키마({})로 바꾼다. */
function rewriteRefs(node: unknown, ref: string, next: string | undefined): unknown {
	if (Array.isArray(node)) return node.map((item) => rewriteRefs(item, ref, next));
	if (!node || typeof node !== "object") return node;
	const record = node as Record<string, unknown>;
	if (record.$ref === ref) {
		return next ? { ...record, $ref: next } : {};
	}
	return Object.fromEntries(
		Object.entries(record).map(([key, value]) => [key, rewriteRefs(value, ref, next)]),
	);
}
