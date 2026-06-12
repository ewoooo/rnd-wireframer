/**
 * JSX 소스 문자열 직렬화기.
 *
 * 모든 출력은 biome 규칙(탭 들여쓰기, 더블 쿼트)을 따르는 정적 TSX 텍스트다.
 * indent 파라미터는 "해당 표현식이 시작되는 줄"의 들여쓰기 접두사이며,
 * 중첩 객체/배열은 indent + 탭으로 한 단계씩 내려간다.
 */

const IDENTIFIER_REGEX = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const INLINE_EXPRESSION_LIMIT = 72;
const INLINE_ELEMENT_LIMIT = 100;

/** 값 → JS 표현식 텍스트. 문자열은 JSON 이스케이프, 객체 키는 식별자면 비인용. */
export function serializeJsExpression(value: unknown, indent = ""): string {
	if (value === null) return "null";
	if (value === undefined) return "undefined";
	if (typeof value === "string") return JSON.stringify(value);
	if (typeof value === "number" || typeof value === "boolean") return String(value);
	if (Array.isArray(value)) return serializeArrayExpression(value, indent);
	if (typeof value === "object") {
		return serializeObjectExpression(value as Record<string, unknown>, indent);
	}
	// function/symbol 등 — 정적 export 대상이 아님. 문자열로 고정해 출력만 보존한다.
	return JSON.stringify(String(value));
}

function serializeArrayExpression(items: unknown[], indent: string): string {
	if (items.length === 0) return "[]";

	const inline = `[${items.map((item) => serializeJsExpression(item, indent)).join(", ")}]`;
	if (!inline.includes("\n") && inline.length <= INLINE_EXPRESSION_LIMIT) return inline;

	const childIndent = `${indent}\t`;
	const body = items
		.map((item) => `${childIndent}${serializeJsExpression(item, childIndent)},`)
		.join("\n");
	return `[\n${body}\n${indent}]`;
}

function serializeObjectExpression(value: Record<string, unknown>, indent: string): string {
	const entries = Object.entries(value)
		.filter(([, entryValue]) => entryValue !== undefined)
		.sort(([a], [b]) => a.localeCompare(b));
	if (entries.length === 0) return "{}";

	const pair = ([key, entryValue]: [string, unknown], pairIndent: string) =>
		`${IDENTIFIER_REGEX.test(key) ? key : JSON.stringify(key)}: ${serializeJsExpression(entryValue, pairIndent)}`;

	const inline = `{ ${entries.map((entry) => pair(entry, indent)).join(", ")} }`;
	if (!inline.includes("\n") && inline.length <= INLINE_EXPRESSION_LIMIT) return inline;

	const childIndent = `${indent}\t`;
	const body = entries.map((entry) => `${childIndent}${pair(entry, childIndent)},`).join("\n");
	return `{\n${body}\n${indent}}`;
}

/**
 * 단일 JSX attribute 텍스트.
 * - undefined → 생략(undefined 반환)
 * - true → shorthand(`name`)
 * - 안전한 문자열 → `name="…"`, 그 외 → `name={expr}`
 */
export function serializeJsxAttribute(
	name: string,
	value: unknown,
	indent: string,
): string | undefined {
	if (value === undefined) return undefined;
	if (value === true) return name;
	if (typeof value === "string" && !value.includes('"') && !/[\n\r\t]/.test(value)) {
		return `${name}="${value}"`;
	}
	return `${name}={${serializeJsExpression(value, indent)}}`;
}

/** JSX 텍스트 자식. 특수문자/경계 공백이 있으면 `{"…"}` 표현식으로 감싼다. */
export function serializeJsxText(value: string): string {
	if (/[{}<>]/.test(value) || value !== value.trim() || /[\n\r]/.test(value)) {
		return `{${JSON.stringify(value)}}`;
	}
	return value;
}

/**
 * JSX 요소 한 덩어리를 포맷한다.
 * - attributes: 직렬화 완료된 attribute 텍스트(들). 값 표현식은 indent+탭 기준으로 직렬화돼 있어야 한다.
 * - children: 각 항목은 이미 indent+탭으로 들여쓰기된 완성 블록이다.
 */
export function formatJsxElement({
	attributes,
	children,
	indent,
	name,
}: {
	attributes: readonly (string | undefined)[];
	children: readonly string[];
	indent: string;
	name: string;
}): string {
	const attrs = attributes.filter((attribute): attribute is string => Boolean(attribute));
	const inlineHead = attrs.length > 0 ? `<${name} ${attrs.join(" ")}` : `<${name}`;
	const attrsFitInline =
		!inlineHead.includes("\n") && indent.length + inlineHead.length <= INLINE_ELEMENT_LIMIT;

	const attrIndent = `${indent}\t`;
	const attrLines = attrs.map((attribute) => `${attrIndent}${attribute}`).join("\n");
	const selfClose = attrsFitInline
		? `${indent}${inlineHead} />`
		: `${indent}<${name}\n${attrLines}\n${indent}/>`;
	const openTag = attrsFitInline
		? `${indent}${inlineHead}>`
		: `${indent}<${name}\n${attrLines}\n${indent}>`;

	if (children.length === 0) return selfClose;

	// 단일 텍스트 자식만 인라인. 자식 요소(<…>)는 항상 줄바꿈해 트리 구조를 유지한다.
	if (attrsFitInline && children.length === 1 && !children[0].includes("\n")) {
		const child = children[0].trimStart();
		if (!child.startsWith("<")) {
			const inline = `${openTag}${child}</${name}>`;
			if (inline.length <= INLINE_ELEMENT_LIMIT) return inline;
		}
	}

	return `${openTag}\n${children.join("\n")}\n${indent}</${name}>`;
}
