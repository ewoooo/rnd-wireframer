import { parseMarkdownSourceBundle } from "@cx/adapters/markdown";
import { describe, expect, it } from "vitest";

describe("@cx/adapters/markdown", () => {
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
			schemaVersion: "source-spec.v0.1",
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
		expect(
			result.sourceSpec.sourceShape.screen.regions.flatMap((region) =>
				region.children.flatMap((area) =>
					area.children.map((component) => component.sourceComponentId),
				),
			),
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
						"| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 표시 텍스트 | 바인딩(소스) | 비고 |",
						"|------|-----|------------|---------------|-------------|---------|-------------|--------------|------|",
						"| 0 | 1 | AppBarHeader | 화면 상단 네비게이션 | AppBar | WithBack | title: 상품 상세 핵심 요약 탐색 | - (static) | - |",
						"| 1 | 2 | BadgeProductStatus | 상품 판매 상태별 강조 | Badge | blue | badge: {판매 상태} | 판매 상태 (api:FN-PRDD-DTL-001) | [정책:PI-PRDD-SUMMARY-001-01] 가입 가능성 강조 |",
					].join("\n"),
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec.sourceShape.screen).toMatchObject({
			screenCode: "NOVA-PRDD-PG-001-0",
			name: "상품 상세 핵심 요약 탐색",
			regions: [
				{
					slot: "header",
					children: [
						{
							kind: "area",
							sourceAreaId: "0",
							children: [
								{
									kind: "component",
									sourceComponentId: "AppBar",
									label: "AppBarHeader",
									raw: {
										bindingSource: "- (static)",
										displayText: "title: 상품 상세 핵심 요약 탐색",
									},
									text: "title: 상품 상세 핵심 요약 탐색",
									variant: "WithBack",
								},
							],
						},
					],
				},
				{
					slot: "contents",
					children: [
						{
							kind: "area",
							sourceAreaId: "1",
							children: [
								{
									kind: "component",
									sourceComponentId: "Badge",
									label: "BadgeProductStatus",
									raw: {
										bindingSource: "판매 상태 (api:FN-PRDD-DTL-001)",
										displayText: "badge: {판매 상태}",
										note: "[정책:PI-PRDD-SUMMARY-001-01] 가입 가능성 강조",
									},
									text: "badge: {판매 상태}",
									variant: "blue",
								},
							],
						},
					],
				},
			],
		});
	});

	it("maps reserved PRDD area numbers to screen slots even when text is ambiguous", () => {
		const result = parseMarkdownSourceBundle({
			importId: "reserved-area-prdd",
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
						"| 0 | static | 공통 영역 | vertical |",
						"| 1 | dynamic | 상품 정보 | vertical |",
						"| 999 | static | 공통 영역 | vertical |",
						"## 컴포넌트 상세",
						"| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 표시 텍스트 |",
						"|------|-----|------------|---------------|-------------|---------|-------------|",
						"| 0 | 1 | AppBarHeader | 네비게이션 | AppBar | WithBack | title: 상품 상세 |",
						"| 999 | 2 | BottomCTA | 구매 액션 | Button | primary | label: 가입하기 |",
					].join("\n"),
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec.sourceShape.screen.regions).toEqual([
			{
				slot: "header",
				children: [
					{
						areaType: "static",
						description: "공통 영역",
						kind: "area",
						layout: "vertical",
						renderNodeType: "area.static",
						sourceAreaId: "0",
						children: [expect.objectContaining({ sourceComponentId: "AppBar" })],
					},
				],
			},
			{
				slot: "contents",
				children: [
					{
						areaType: "dynamic",
						description: "상품 정보",
						kind: "area",
						layout: "vertical",
						renderNodeType: "area.dynamic",
						sourceAreaId: "1",
						children: [],
					},
				],
			},
			{
				slot: "bottom",
				children: [
					{
						areaType: "static",
						description: "공통 영역",
						kind: "area",
						layout: "vertical",
						renderNodeType: "area.static",
						sourceAreaId: "999",
						children: [expect.objectContaining({ sourceComponentId: "Button" })],
					},
				],
			},
		]);
	});

	it("creates implicit header and bottom areas from component details when composition rows are missing", () => {
		const result = parseMarkdownSourceBundle({
			importId: "implicit-reserved-area-prdd",
			files: [
				{
					kind: "screen",
					path: "data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md",
					content: [
						"---",
						"화면 ID: NOVA-PRDD-PG-001-0",
						"화면 명: 상품 상세 핵심 요약 탐색",
						"---",
						"## 컴포넌트 상세",
						"| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 표시 텍스트 |",
						"|------|-----|------------|---------------|-------------|---------|-------------|",
						"| 0 | 1 | AppBarHeader | 네비게이션 | AppBar | WithBack | title: 상품 상세 |",
						"| 999 | 2 | BottomCTA | 구매 액션 | Button | primary | label: 가입하기 |",
					].join("\n"),
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec.sourceShape.screen.regions).toEqual([
			{
				slot: "header",
				children: [
					{
						kind: "area",
						sourceAreaId: "0",
						children: [expect.objectContaining({ sourceComponentId: "AppBar" })],
					},
				],
			},
			{
				slot: "bottom",
				children: [
					{
						kind: "area",
						sourceAreaId: "999",
						children: [expect.objectContaining({ sourceComponentId: "Button" })],
					},
				],
			},
		]);
	});

	it("keeps hierarchical content area ids as area nodes under the contents region", () => {
		const result = parseMarkdownSourceBundle({
			importId: "hierarchical-area-prdd",
			files: [
				{
					kind: "screen",
					path: "data/client-imports/{id}/screen/NOVA-PRDD-PG-001-0.md",
					content: [
						"---",
						"화면 ID: NOVA-PRDD-PG-001-0",
						"화면 명: 상품 상세 핵심 요약 탐색",
						"---",
						"## 컴포넌트 상세",
						"| 영역 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | 표시 텍스트 |",
						"|------|-----|------------|---------------|-------------|---------|-------------|",
						"| 1-1 | 1 | 상품 요약 | 상품 요약 | CardSummary | text | title: 상품 |",
						"| 1-2 | 2 | 판매 상태 | 상태 배지 | Badge | blue | badge: 판매중 |",
						"| 2-1 | 3 | 상품 정보 | 정보 목록 | ListText | on | title: 상품 유형 |",
					].join("\n"),
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec.sourceShape.screen.regions).toEqual([
			{
				slot: "contents",
				children: [
					{
						kind: "area",
						sourceAreaId: "1-1",
						children: [expect.objectContaining({ sourceComponentId: "CardSummary" })],
					},
					{
						kind: "area",
						sourceAreaId: "1-2",
						children: [expect.objectContaining({ sourceComponentId: "Badge" })],
					},
					{
						kind: "area",
						sourceAreaId: "2-1",
						children: [expect.objectContaining({ sourceComponentId: "ListText" })],
					},
				],
			},
		]);
	});

	it("maps component section names to source areas while preserving source ids and component types", () => {
		const result = parseMarkdownSourceBundle({
			importId: "mbr-section-name-prdd",
			files: [
				{
					kind: "screen",
					path: "data/client-imports/{id}/260528_mbr/NOVA-MBR-PG-001-0.md",
					content: [
						"---",
						"화면 ID: NOVA-MBR-PG-001-0",
						"화면 명: 약관 동의",
						"---",
						"## 화면 구성",
						"| 섹션 번호 | 섹션 유형 | 섹션 명 | 섹션 설명 | 섹션 레이아웃 | 노출 조건 | 노출 개수 (최소) | 노출 개수 (최대) | 오류 처리 방식 |",
						"| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
						"| 0 | static | AppBarSection | 화면 상단 네비게이션 | vertical | 항상 | - | - | - |",
						"| 1 | dynamic | TermsSection | 가입 약관 조회 및 동의 입력 | vertical | 회원 가입 진입 시 | 2 | N | 섹션 전체 숨김 |",
						"| 999 | dynamic | ActionButtonSection | 화면 하단 액션 섹션 | vertical | 항상 | - | - | - |",
						"## 컴포넌트 상세",
						"| 섹션 명 | no. | 컴포넌트 명 | 컴포넌트 설명 | 컴포넌트 ID | variant | props | 비고 |",
						"| --- | --- | --- | --- | --- | --- | --- | --- |",
						"| AppBarSection | 1 | AppBarHeader | 가입 약관 헤더 | AppBar | - | title: 약관 동의<br>showBack: true | 화면 크롬 |",
						"| TermsSection | 1 | ListTextTerms | 약관 목록 행 | ListText | dot | title: {약관명} (예: 서비스 이용약관)<br>showRightItem: true | 약관 전문/요약/개정 이력 노출 |",
						"| ActionButtonSection | 1 | ActionButtonNext | 다음 CTA | ActionButton | - | main.text: 다음 | 필수 약관 모두 동의 시 활성화 |",
					].join("\n"),
				},
			],
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec.sourceShape.screen.regions).toEqual([
			{
				slot: "header",
				children: [
					{
						areaType: "static",
						description: "화면 상단 네비게이션",
						kind: "area",
						layout: "vertical",
						renderNodeType: "area.static",
						sourceAreaId: "0",
						sourceAreaName: "AppBarSection",
						visibility: "항상",
						children: [
							expect.objectContaining({
								componentType: "AppBar",
								description: "가입 약관 헤더",
								props: {
									showBack: true,
									title: "약관 동의",
								},
								sourceComponentId: "AppBar",
								sourceId: "AppBarHeader",
							}),
						],
					},
				],
			},
			{
				slot: "contents",
				children: [
					{
						areaType: "dynamic",
						description: "가입 약관 조회 및 동의 입력",
						errorPolicy: "섹션 전체 숨김",
						kind: "area",
						layout: "vertical",
						maxCount: "N",
						minCount: "2",
						renderNodeType: "area.dynamic",
						sourceAreaId: "1",
						sourceAreaName: "TermsSection",
						visibility: "회원 가입 진입 시",
						children: [
							expect.objectContaining({
								componentType: "ListText",
								description: "약관 목록 행",
								props: {
									showRightItem: true,
									title: "{약관명} (예: 서비스 이용약관)",
								},
								sourceComponentId: "ListText",
								sourceId: "ListTextTerms",
								variant: "dot",
							}),
						],
					},
				],
			},
			{
				slot: "bottom",
				children: [
					{
						areaType: "dynamic",
						description: "화면 하단 액션 섹션",
						kind: "area",
						layout: "vertical",
						renderNodeType: "area.dynamic",
						sourceAreaId: "999",
						sourceAreaName: "ActionButtonSection",
						visibility: "항상",
						children: [
							expect.objectContaining({
								componentType: "ActionButton",
								description: "다음 CTA",
								props: {
									"main.text": "다음",
								},
								sourceComponentId: "ActionButton",
								sourceId: "ActionButtonNext",
							}),
						],
					},
				],
			},
		]);
	});
});
