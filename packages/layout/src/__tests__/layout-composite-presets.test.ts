import { listLayoutCatalog } from "@cx/layout/resolver";
import { describe, expect, it } from "vitest";
import { compositeDefaults } from "../components/composites/presets";

describe("composite presets ↔ catalog 완전성", () => {
	it("모든 composite catalog entry는 defaults preset을 가진다", () => {
		const missing = listLayoutCatalog({ target: "composite" })
			.map((e) => e.id.replace("layout.composite.", ""))
			.filter((key) => !(key in compositeDefaults));
		expect(missing).toEqual([]);
	});

	it("preset 키는 catalog에 없는 잉여가 없다", () => {
		const ids = new Set(
			listLayoutCatalog({ target: "composite" }).map((e) => e.id.replace("layout.composite.", "")),
		);
		const extra = Object.keys(compositeDefaults).filter((k) => !ids.has(k));
		expect(extra).toEqual([]);
	});
});
