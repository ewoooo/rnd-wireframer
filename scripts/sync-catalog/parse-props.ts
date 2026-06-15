/**
 * kiki 컴포넌트 .tsx 파일에서 Props 인터페이스를 파싱한다.
 * TypeScript compiler API를 사용해 prop 이름·타입·optional 여부를 추출.
 */
import { readFileSync } from "node:fs";
import ts from "typescript";

export type PropType = "string" | "number" | "boolean" | "enum" | "node" | "array";

export interface ParsedProp {
	name: string;
	required: boolean;
	type: PropType;
	values?: string[]; // enum일 때
	defaultValue?: unknown;
}

export function parseProps(tsxFilePath: string): ParsedProp[] {
	const source = readFileSync(tsxFilePath, "utf-8");
	const sourceFile = ts.createSourceFile(tsxFilePath, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);

	const results: ParsedProp[] = [];

	ts.forEachChild(sourceFile, (node) => {
		// Props 인터페이스 탐색 (이름이 Props로 끝나는 것)
		if (ts.isInterfaceDeclaration(node) && node.name.text.endsWith("Props")) {
			for (const member of node.members) {
				if (!ts.isPropertySignature(member) || !ts.isIdentifier(member.name)) continue;
				// HTMLAttributes 등 extends로 상속된 건 여기서 안 나옴 (선언된 것만)
				const propName = member.name.text;
				const optional = !!member.questionToken;
				const classified = member.type ? classifyType(member.type) : { type: "string" as PropType };
				results.push({ name: propName, required: !optional, ...classified });
			}
		}
	});

	return results;
}

function classifyType(typeNode: ts.TypeNode): { type: PropType; values?: string[] } {
	// string literal union → enum
	if (ts.isUnionTypeNode(typeNode)) {
		const stringLiterals: string[] = [];
		let hasBoolean = false;
		let hasNode = false;

		for (const t of typeNode.types) {
			if (t.kind === ts.SyntaxKind.UndefinedKeyword || t.kind === ts.SyntaxKind.NullKeyword) continue;
			if (ts.isLiteralTypeNode(t) && ts.isStringLiteral(t.literal)) {
				stringLiterals.push(t.literal.text);
			} else if (
				ts.isLiteralTypeNode(t) &&
				(t.literal.kind === ts.SyntaxKind.TrueKeyword || t.literal.kind === ts.SyntaxKind.FalseKeyword)
			) {
				hasBoolean = true;
			} else if (t.kind === ts.SyntaxKind.BooleanKeyword) {
				hasBoolean = true;
			} else if (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)) {
				const name = t.typeName.text;
				if (name === "ReactNode" || name === "ReactElement") hasNode = true;
			}
		}

		if (stringLiterals.length > 0) return { type: "enum", values: stringLiterals };
		if (hasBoolean) return { type: "boolean" };
		if (hasNode) return { type: "node" };
	}

	// 단일 타입
	if (typeNode.kind === ts.SyntaxKind.StringKeyword) return { type: "string" };
	if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return { type: "number" };
	if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) return { type: "boolean" };
	if (ts.isArrayTypeNode(typeNode)) return { type: "array" };

	if (ts.isTypeReferenceNode(typeNode) && ts.isIdentifier(typeNode.typeName)) {
		const name = typeNode.typeName.text;
		if (name === "ReactNode" || name === "ReactElement") return { type: "node" };
		if (name === "Array") return { type: "array" };
	}

	// 알 수 없는 복잡한 타입 → string fallback
	return { type: "string" };
}
