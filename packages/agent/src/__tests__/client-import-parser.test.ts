import { describe, expect, it } from "vitest";
import { parseClientImportMarkdownBundle } from "../register/client-import-parser";

const SCREEN = `---
화면 ID: NOVA-MBR-FP-001-0
화면 명: 회원 약관 동의
화면 설명: 회원 가입 약관을 확인한다.
---

## 화면 구성

| no | 오가니즘 ID |
|----|-------------|
| 1 | ogn-mbr-terms |
`;

const AREA = `---
오가니즘 ID: ogn-mbr-terms
오가니즘 명: 약관 목록
오가니즘 설명: 필수 약관 리스트
---

## 오가니즘 정보

| no | 오가니즘 레이아웃 |
|----|------------------|
| 1 | vertical |

## 컴포넌트 상세

| no | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 비고 |
|----|-------------|---------------|-------------|---------|------|
| 1 | cmp-title | 약관 제목 | SectionHeader | - | - |
| 2 | cmp-terms | 약관 항목 | ListCell | required | [정책:PI-MBR-001] |
`;

describe("parseClientImportMarkdownBundle", () => {
	it("parses screen/area markdown into a GeneratedNodeTree candidate", () => {
		const result = parseClientImportMarkdownBundle({
			importId: "mbr-terms",
			screenFiles: [{ name: "screen.md", content: SCREEN }],
			areaFiles: [{ name: "area.md", content: AREA }],
		});

		expect(result.validation.errors).toEqual([]);
		expect(result.generated.routes[0]?.variants[0]?.screens[0]?.areas).toEqual([
			{ areaId: "ogn-mbr-terms", order: 1 },
		]);
		expect(result.generated.areas?.[0]).toMatchObject({
			id: "ogn-mbr-terms",
			name: "약관 목록",
			layout: "vertical",
			children: [
				{ componentId: "cmp-title", order: 1 },
				{ componentId: "cmp-terms", order: 2 },
			],
		});
		expect(result.generated.components?.map((component) => component.type)).toEqual([
			"SectionHeader",
			"ListCell",
		]);
	});

	it("reports missing area references before promote/import", () => {
		const result = parseClientImportMarkdownBundle({
			importId: "broken",
			screenFiles: [{ name: "screen.md", content: SCREEN }],
			areaFiles: [],
		});

		expect(result.validation.errors).toContain("NOVA-MBR-FP-001-0: missing area ogn-mbr-terms");
	});
});
