import { describe, expect, it } from "vitest";
import { getJsonSchema } from "../json-schema-registry";
import { toStructuredOutputJsonSchema } from "../structured-output";

describe("toStructuredOutputJsonSchema", () => {
	it("returns non-recursive schemas unchanged", () => {
		const schema = getJsonSchema("composition-plan");
		expect(toStructuredOutputJsonSchema(schema)).toBe(schema);
	});

	it("unrolls render-tree recursion so no $def references itself", () => {
		const unrolled = toStructuredOutputJsonSchema(getJsonSchema("render-tree"));
		const defs = (unrolled as Record<string, unknown>).$defs as Record<string, unknown>;

		// 원본 재귀 def는 사라지고 depth 사본으로 대체된다.
		expect(defs.componentNode).toBeUndefined();
		expect(defs.propValue).toBeUndefined();
		expect(defs.componentNode__1).toBeDefined();
		expect(defs.componentNode__6).toBeDefined();
		expect(defs.propValue__1).toBeDefined();

		for (const [name, def] of Object.entries(defs)) {
			expect(containsRef(def, `#/$defs/${name}`), `self-recursive def: ${name}`).toBe(false);
		}
		// 비재귀 def의 참조는 1단 사본을 가리킨다.
		expect(containsRef(defs.areaNode, "#/$defs/componentNode__1")).toBe(true);
		expect(containsRef(defs.areaNode, "#/$defs/componentNode")).toBe(true); // prefix 포함이므로 사본 ref도 매치
		expect(containsExactRef(defs.areaNode, "#/$defs/componentNode")).toBe(false);
	});
});

function containsRef(node: unknown, ref: string): boolean {
	if (Array.isArray(node)) return node.some((item) => containsRef(item, ref));
	if (!node || typeof node !== "object") return false;
	const record = node as Record<string, unknown>;
	if (typeof record.$ref === "string" && record.$ref.startsWith(ref)) return true;
	return Object.values(record).some((value) => containsRef(value, ref));
}

function containsExactRef(node: unknown, ref: string): boolean {
	if (Array.isArray(node)) return node.some((item) => containsExactRef(item, ref));
	if (!node || typeof node !== "object") return false;
	const record = node as Record<string, unknown>;
	if (record.$ref === ref) return true;
	return Object.values(record).some((value) => containsExactRef(value, ref));
}
