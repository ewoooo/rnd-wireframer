import { describe, expect, it } from "vitest";
import {
	formatJsxElement,
	serializeJsExpression,
	serializeJsxAttribute,
	serializeJsxText,
} from "../serialize";

describe("serializeJsExpression", () => {
	it("serializes primitives", () => {
		expect(serializeJsExpression("약관 동의")).toBe('"약관 동의"');
		expect(serializeJsExpression(42)).toBe("42");
		expect(serializeJsExpression(true)).toBe("true");
		expect(serializeJsExpression(null)).toBe("null");
	});

	it("escapes strings inside nested objects", () => {
		expect(serializeJsExpression({ title: 'say "hi"\nnow' })).toBe(
			'{ title: "say \\"hi\\"\\nnow" }',
		);
	});

	it("sorts object keys and quotes non-identifier keys", () => {
		expect(serializeJsExpression({ b: 1, a: 2, "data-x": 3 })).toBe('{ a: 2, b: 1, "data-x": 3 }');
	});

	it("keeps short arrays inline and breaks long structures with tab indentation", () => {
		expect(serializeJsExpression([1, 2, 3])).toBe("[1, 2, 3]");

		const longText =
			"상품·옵션·조건·정책 중 어디서 막혔는지와 수정 방법을 확인하세요 — 길어진 항목";
		expect(serializeJsExpression({ items: [longText, longText] }, "\t")).toBe(
			[
				"{",
				"\t\titems: [",
				`\t\t\t${JSON.stringify(longText)},`,
				`\t\t\t${JSON.stringify(longText)},`,
				"\t\t],",
				"\t}",
			].join("\n"),
		);
	});

	it("drops undefined object entries", () => {
		expect(serializeJsExpression({ a: undefined, b: 1 })).toBe("{ b: 1 }");
	});
});

describe("serializeJsxAttribute", () => {
	it("uses quoted form for safe strings", () => {
		expect(serializeJsxAttribute("title", "약관 동의", "")).toBe('title="약관 동의"');
	});

	it("falls back to an expression when the string contains a double quote or newline", () => {
		expect(serializeJsxAttribute("title", 'a "b"', "")).toBe('title={"a \\"b\\""}');
		expect(serializeJsxAttribute("title", "a\nb", "")).toBe('title={"a\\nb"}');
	});

	it("emits boolean shorthand for true and expressions for other primitives", () => {
		expect(serializeJsxAttribute("showBack", true, "")).toBe("showBack");
		expect(serializeJsxAttribute("showBack", false, "")).toBe("showBack={false}");
		expect(serializeJsxAttribute("gap", 12, "")).toBe("gap={12}");
		expect(serializeJsxAttribute("value", null, "")).toBe("value={null}");
	});

	it("omits undefined values", () => {
		expect(serializeJsxAttribute("title", undefined, "")).toBeUndefined();
	});

	it("serializes object values as expressions", () => {
		expect(serializeJsxAttribute("layout", { direction: "column", gap: 8 }, "")).toBe(
			'layout={{ direction: "column", gap: 8 }}',
		);
	});
});

describe("serializeJsxText", () => {
	it("keeps plain text raw", () => {
		expect(serializeJsxText("계속하기")).toBe("계속하기");
	});

	it("wraps text with JSX specials or boundary whitespace in an expression", () => {
		expect(serializeJsxText("{실패축} 문제")).toBe('{"{실패축} 문제"}');
		expect(serializeJsxText(" 공백 ")).toBe('{" 공백 "}');
	});
});

describe("formatJsxElement", () => {
	it("self-closes without children", () => {
		expect(
			formatJsxElement({ attributes: ['title="a"'], children: [], indent: "\t", name: "AppBar" }),
		).toBe('\t<AppBar title="a" />');
	});

	it("inlines a single short text child", () => {
		expect(
			formatJsxElement({
				attributes: [],
				children: ["\t\t계속하기"],
				indent: "\t",
				name: "Button",
			}),
		).toBe("\t<Button>계속하기</Button>");
	});

	it("breaks attributes onto their own lines when they are multiline", () => {
		const props = `props={${serializeJsExpression(
			{
				description: "상품·옵션·조건·정책 중 어디서 막혔는지와 수정 방법을 확인하세요",
				title: "담기에 실패한 이유와 해결 방법 그리고 더 길어지는 제목 텍스트",
			},
			"\t\t",
		)}}`;
		const element = formatJsxElement({
			attributes: [props],
			children: ["\t\t<Inner />"],
			indent: "\t",
			name: "Wrapper",
		});
		expect(element.split("\n")[0]).toBe("\t<Wrapper");
		expect(element).toContain("\n\t>");
		expect(element.endsWith("\t</Wrapper>")).toBe(true);
	});
});
