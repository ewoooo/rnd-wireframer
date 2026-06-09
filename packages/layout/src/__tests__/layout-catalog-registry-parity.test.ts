import { getEntry, listCatalog } from "@cx/layout/catalog";
import { listLayoutPatternComponents } from "@cx/layout/components";
import { describe, expect, it } from "vitest";

const entries = listLayoutPatternComponents();

describe("layout registry ↔ catalog parity", () => {
	it("모든 등록 layoutId는 catalog entry를 가진다", () => {
		const orphans = entries
			.filter((e) => getEntry(e.layoutId) === undefined)
			.map((e) => e.layoutId);
		expect(orphans).toEqual([]);
	});

	it("모든 등록 layoutId는 실제 렌더 가능한 함수형 component를 가진다", () => {
		const nonRenderable = entries
			.filter((e) => typeof e.component !== "function")
			.map((e) => e.layoutId);
		expect(nonRenderable).toEqual([]);
	});

	it("모든 catalog entry는 registry에 component를 가진다", () => {
		const registered = new Set(entries.map((e) => e.layoutId));
		const dangling = listCatalog()
			.filter((c) => !registered.has(c.id))
			.map((c) => c.id);
		expect(dangling).toEqual([]);
	});

	it("registry-derived props가 catalog props와 일치한다", () => {
		const mismatches = entries
			.map((e) => {
				const catalogProps = Object.keys(getEntry(e.layoutId)?.props ?? {}).sort();
				const registryProps = Object.keys(e.pattern.props ?? {}).sort();
				return {
					layoutId: e.layoutId,
					registryOnly: registryProps.filter((p) => !catalogProps.includes(p)),
					catalogOnly: catalogProps.filter((p) => !registryProps.includes(p)),
				};
			})
			.filter((m) => m.registryOnly.length > 0 || m.catalogOnly.length > 0);
		expect(mismatches).toEqual([]);
	});
});
