import { describe, expect, it } from "vitest";
// 축2: catalog.generated 무결성 — entry 데이터 export 안정성.
// (T8에서 catalog.generated.ts 생성 전까지 RED)
import { layoutCatalog } from "../../catalog.generated";

const TARGETS = new Set(["screen", "region", "area", "composite"]);
const PROP_TYPES = new Set(["array", "boolean", "enum", "node", "number", "object", "string"]);
const STATUSES = new Set([undefined, "stable", "draft", "deprecated"]);

describe("external-thin: catalog.generated 무결성", () => {
	const entries = Object.entries(layoutCatalog);

	it("catalog가 비어 있지 않다", () => {
		expect(entries.length).toBeGreaterThan(0);
	});

	it("모든 entry: key === entry.id", () => {
		const mismatched = entries.filter(([key, entry]) => key !== entry.id).map(([key]) => key);
		expect(mismatched).toEqual([]);
	});

	it("모든 entry의 target이 유효하고 id 접두사와 일치한다", () => {
		const bad = entries.filter(
			([, e]) => !TARGETS.has(e.target) || !e.id.startsWith(`layout.${e.target}.`),
		);
		expect(bad.map((e) => e[0])).toEqual([]);
	});

	it("모든 prop 계약 type이 유효하고 enum은 values를 가진다", () => {
		const bad: string[] = [];
		for (const [id, e] of entries) {
			for (const [name, c] of Object.entries(e.props ?? {})) {
				if (!PROP_TYPES.has(c.type)) bad.push(`${id}.${name}:type`);
				if (c.type === "enum" && !Array.isArray(c.values)) bad.push(`${id}.${name}:values`);
			}
		}
		expect(bad).toEqual([]);
	});

	it("status가 유효 어휘다", () => {
		const bad = entries.filter(([, e]) => !STATUSES.has(e.status)).map(([k]) => k);
		expect(bad).toEqual([]);
	});
});
