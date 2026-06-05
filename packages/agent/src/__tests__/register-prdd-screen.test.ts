import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { registerPrddScreen } from "../register/register-prdd-screen";

const ROOT = resolve(__dirname, "..", "..", "..", "..");

describe("registerPrddScreen", () => {
	it("실제 PRDD 에서 runtime + PrddScreenRecord 동시 생성, invariant 통과", () => {
		const path = resolve(ROOT, "database/client-imports/PRDD/screen/NOVA-PRDD-PG-001-0.md");
		const source = readFileSync(path, "utf8");

		const result = registerPrddScreen(source, { importJobId: "test-job-001" });

		expect(result.screenId).toBe("NOVA-PRDD-PG-001-0");
		expect(result.prddScreenRecord.id).toBe(result.runtime.screen.id);
		expect(result.prddScreenRecord.importJobId).toBe("test-job-001");

		// invariant
		expect(result.invariantViolations).toEqual([]);
	});

	it("importJobId 미지정 시 자동 생성 + 두 표상에 같은 값 부여", () => {
		const path = resolve(ROOT, "database/client-imports/PRDD/screen/NOVA-PRDD-PG-001-0.md");
		const source = readFileSync(path, "utf8");

		const result = registerPrddScreen(source);
		expect(result.importJobId).toBeTruthy();
		expect(result.prddScreenRecord.importJobId).toBe(result.importJobId);
	});
});
