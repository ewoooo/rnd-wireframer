import { parseMarkdownSourceBundle } from "@cx/parser/markdown";
import { describe, expect, it } from "vitest";

describe("@cx/parser markdown MVP parser", () => {
	it("parses markdown bundle into a SourceSpec shape", () => {
		const result = parseMarkdownSourceBundle({
			importId: "PRDD-2026-05-sample",
			receivedAt: "2026-05-27T00:00:00.000Z",
			files: [
				{
					kind: "screen",
					path: "database/client-imports/PRDD/screen/NOVA-PRDD-PG-001-0.md",
					content: [
						"# 상품 상세",
						"route: /product/detail",
						"## 상단 앱바",
						"## 상품 요약",
						"CardSummary",
						"label: 상품 핵심 요약",
						"text: iPhone 16 Pro",
						"## 가입 CTA",
						"ActionButton",
					].join("\n"),
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec).toMatchObject({
			schemaVersion: "generation-v2.source-spec.v0.1",
			sourceImport: {
				importId: "PRDD-2026-05-sample",
				sourceKind: "prdd-markdown-bundle",
			},
			sourceShape: {
				screen: {
					screenCode: "NOVA-PRDD-PG-001-0",
					name: "상품 상세",
					route: "/product/detail",
				},
			},
		});
		expect(result.sourceSpec.sourceShape.screen.areas.length).toBeGreaterThan(0);
		expect(
			result.sourceSpec.sourceShape.components.map((component) => component.sourceComponentId),
		).toEqual(["CardSummary", "ActionButton"]);
	});

	it("reports empty content as an error while preserving a partial SourceSpec", () => {
		const result = parseMarkdownSourceBundle({
			importId: "empty",
			files: [{ kind: "screen", path: "screen/EMPTY.md", content: "" }],
		});

		expect(result.ok).toBe(false);
		expect(result.issues).toContainEqual(
			expect.objectContaining({
				code: "empty-content",
				severity: "error",
			}),
		);
		expect(result.sourceSpec?.sourceImport.files[0]?.checksum).toMatch(/^mvp-/);
	});

	it("extracts PRDD table areas and component details", () => {
		const result = parseMarkdownSourceBundle({
			importId: "table-prdd",
			files: [
				{
					kind: "screen",
					path: "data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md",
					content: [
						"---",
						"화면 ID: NOVA-PRDD-PG-001-0",
						"화면 명: 상품 상세 핵심 요약 탐색",
						"---",
						"## 화면 구성",
						"| no. | 영역 유형 | 영역 설명 | 영역 레이아웃 |",
						"|-----|-----------|-----------|---------------|",
						"| 0 | static | 화면 상단 네비게이션 | vertical |",
						"| 1 | dynamic | 상품 요약·핵심 속성 표시 영역 | vertical |",
						"## 컴포넌트 상세",
						"| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 표시 텍스트 |",
						"|------|-----|------------|---------------|-------------|---------|-------------|",
						"| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | title: 상품 상세 핵심 요약 탐색 |",
						"| 1 | 2 | BadgeProductStatus | 상품 판매 상태별 강조 | Badge | blue | badge: {판매 상태} |",
					].join("\n"),
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec.sourceShape.screen).toMatchObject({
			screenCode: "NOVA-PRDD-PG-001-0",
			name: "상품 상세 핵심 요약 탐색",
			areas: [
				{ sourceAreaNo: 0, slotHint: "header", name: "화면 상단 네비게이션" },
				{ sourceAreaNo: 1, slotHint: "contents", name: "상품 요약·핵심 속성 표시 영역" },
			],
		});
		expect(result.sourceSpec.sourceShape.components).toEqual([
			{
				sourceAreaNo: 0,
				sourceComponentId: "AppBar",
				label: "AppBarHeader",
				text: "title: 상품 상세 핵심 요약 탐색",
				variant: "WithBack",
			},
			{
				sourceAreaNo: 1,
				sourceComponentId: "Badge",
				label: "BadgeProductStatus",
				text: "badge: {판매 상태}",
				variant: "blue",
			},
		]);
	});
});
