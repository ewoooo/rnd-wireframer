import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
	buildRegistryModule,
	deriveCatalog,
	findCatalogDrift,
} from "../../../../scripts/sync-catalog/lib";
import { externalCatalog } from "../catalog.generated";
import { catalogSource } from "../catalog.source";
import * as registry from "../registry.generated";

const COMPONENTS_DIR = resolve(import.meta.dirname, "..", "components");

function readComponentDirNames(): string[] {
	return readdirSync(COMPONENTS_DIR).filter((name) =>
		statSync(join(COMPONENTS_DIR, name)).isDirectory(),
	);
}

describe("sync-catalog parity", () => {
	it("catalog.source.ts에서 파생한 카탈로그가 catalog.generated.ts와 동일하다", () => {
		expect(deriveCatalog(catalogSource)).toEqual(externalCatalog);
	});

	it("registry export가 카탈로그 type의 export 이름과 1:1로 일치한다", () => {
		const exportNames = Object.keys(registry).sort();
		const expected = Object.keys(externalCatalog)
			.map((type) => type.replace(/^kiki\./, ""))
			.sort();
		expect(exportNames).toEqual(expected);
	});

	it("catalog.source.ts와 components/ 사이에 드리프트가 없다", () => {
		expect(findCatalogDrift(catalogSource, readComponentDirNames())).toEqual([]);
	});

	it("드리프트 가드가 누락·고아 엔트리를 잡는다", () => {
		const source = {
			"kiki.Known": { type: "kiki.Known", source: "kiki-draft", version: "0.0.0", props: {} },
			"kiki.Ghost": { type: "kiki.Ghost", source: "kiki-draft", version: "0.0.0", props: {} },
		} as const;
		const problems = findCatalogDrift(source as unknown as Parameters<typeof findCatalogDrift>[0], [
			"Known",
			"Orphan",
		]);
		expect(problems.some((p) => p.includes("kiki.Ghost"))).toBe(true);
		expect(problems.some((p) => p.includes("Orphan"))).toBe(true);
	});

	it("registry 모듈은 export-name alias를 반영한다", () => {
		const module = buildRegistryModule(["Checkbox", "Radio", "Button"]);
		expect(module).toContain(
			'export { CheckboxText as Checkbox } from "./components/Checkbox/Checkbox";',
		);
		expect(module).toContain('export { RadioText as Radio } from "./components/Radio/Radio";');
		expect(module).toContain('export { Button } from "./components/Button/Button";');
	});
});
