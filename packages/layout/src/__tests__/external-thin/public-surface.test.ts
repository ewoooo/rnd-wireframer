import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// 축1: 데이터 export 표면 — layout이 external과 같은 코어 public surface를 갖는지 고정.
function readPkg(rel: string): { exports: Record<string, unknown> } {
	return JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8"));
}

const layoutPkg = readPkg("../../../package.json");
const externalPkg = readPkg("../../../../external/package.json");

const CORE_SUBPATHS = [".", "./catalog", "./registry", "./resolver", "./canonicalize"] as const;
const REMOVED_SUBPATHS = ["./components", "./contract", "./mutations"] as const;

describe("external-thin: public export surface", () => {
	it("layout이 external 코어 subpath를 모두 노출한다", () => {
		for (const key of CORE_SUBPATHS) {
			expect(layoutPkg.exports, `layout exports missing ${key}`).toHaveProperty([key]);
		}
	});

	it("layout이 폐기된 subpath를 노출하지 않는다", () => {
		for (const key of REMOVED_SUBPATHS) {
			expect(layoutPkg.exports, `layout exports should drop ${key}`).not.toHaveProperty([key]);
		}
	});

	it("external도 동일 코어 subpath를 가진다 (parity baseline)", () => {
		for (const key of CORE_SUBPATHS) {
			expect(externalPkg.exports, `external exports missing ${key}`).toHaveProperty([key]);
		}
	});
});
