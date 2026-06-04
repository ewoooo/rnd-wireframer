import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { parsePrddMarkdown } from "../register/prdd-parser";
import { buildPrddScreenRecord } from "../register/prdd-record-builder";

const ROOT = resolve(__dirname, "..", "..", "..", "..");

describe("buildPrddScreenRecord", () => {
	it("실제 PRDD 파일을 PrddScreenRecord 로 변환한다", () => {
		const path = resolve(ROOT, "database/client-imports/PRDD/screen/NOVA-PRDD-PG-001-0.md");
		const source = readFileSync(path, "utf8");
		const parsed = parsePrddMarkdown(source);
		const record = buildPrddScreenRecord(parsed, { importJobId: "test-job-1" });

		expect(record.id).toBe("NOVA-PRDD-PG-001-0");
		expect(record.importJobId).toBe("test-job-1");
		expect(record.screenType).toBe("screen.page");
		expect(record.policyGroups).toEqual(
			expect.arrayContaining(["PG-PRDD-SUMMARY-001", "PG-PRDD-TPL-001"]),
		);
		expect(record.areas.length).toBeGreaterThan(0);

		// area 0 (header) 와 area 1 (contents) 가 존재
		const header = record.areas.find((a) => a.slot === "header");
		expect(header).toBeDefined();

		// area 1 의 component 들이 보존됨
		const contents = record.areas.find((a) => a.slot === "contents");
		expect(contents).toBeDefined();
		expect(contents?.area.children.length).toBeGreaterThan(0);

		// component 의 displayTextTemplate / bindings / semanticName 보존
		const cardSummary = contents?.area.children.find(
			(c) => c.rawComponentId === "CardSummary",
		);
		expect(cardSummary).toBeDefined();
		expect(cardSummary?.semanticName).toBeTruthy();
		expect(cardSummary?.bindings.length).toBeGreaterThan(0);

		// states / flow 가 채워짐
		expect(record.states.length).toBeGreaterThan(0);
		expect(record.flow.length).toBeGreaterThan(0);

		const flowItem = record.flow[0];
		expect(flowItem.targetScreenId).toBeTruthy();
		expect(flowItem.kind === "transition" || flowItem.kind === "case-branch").toBe(true);
	});

	it("visibilityRuleRaw 가 '항상' 이면 hint.kind='always'", () => {
		const parsed = parsePrddMarkdown(`---
화면 ID: TEST-1
화면 명: test
---

## 화면 구성

| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 | 노출 조건 |
|-----|-----------|-----------|---------------|-----------|
| 1 | dynamic | t | vertical | 항상 |
`);
		const record = buildPrddScreenRecord(parsed, { importJobId: "j" });
		const area = record.areas[0];
		expect(area.area.visibilityRuleRaw).toBe("항상");
		expect(area.area.visibilityRuleHint?.kind).toBe("always");
	});
});
