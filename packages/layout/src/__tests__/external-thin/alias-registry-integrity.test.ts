import { describe, expect, it } from "vitest";
// 축3: alias/registry 무결성. 모든 catalog id가 alias를 통해 실제 registry component로 해석된다.
// (T7~T9 전까지 RED)
import { layoutAlias } from "../../catalog.alias";
import { canonicalizeLayout } from "../../canonicalize-catalog";
import { layoutCatalog } from "../../catalog.generated";
import * as registry from "../../registry.generated";

describe("external-thin: alias / registry 무결성", () => {
	const catalogIds = Object.keys(layoutCatalog);
	const registryKeys = new Set(Object.keys(registry).filter((k) => k !== "default"));

	it("모든 catalog id가 alias 키에 존재한다", () => {
		const missing = catalogIds.filter((id) => !(id in layoutAlias));
		expect(missing).toEqual([]);
	});

	it("모든 alias 값이 registry export(함수형)에 존재한다", () => {
		const bad = Object.entries(layoutAlias)
			.filter(([, key]) => !registryKeys.has(key) || typeof (registry as Record<string, unknown>)[key] !== "function")
			.map(([id, key]) => `${id}->${key}`);
		expect(bad).toEqual([]);
	});

	it("모든 catalog id가 canonicalize→실제 component로 해석된다", () => {
		const unresolved = catalogIds.filter((id) => {
			const key = canonicalizeLayout(id);
			return !key || typeof (registry as Record<string, unknown>)[key] !== "function";
		});
		expect(unresolved).toEqual([]);
	});
});
