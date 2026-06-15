import { parseJsonSourceBundle } from "@cx/adapters/json";
import { describe, expect, it } from "vitest";

const SAMPLE = JSON.stringify({
	메타데이터: {
		화면명: "가족 회선 위임 인증",
		화면ID: "NC-BIL-PU-021-0",
		화면설명: "가족 대표자가 통합 위임 인증한다.",
		경로: "요금·납부 허브 > 가족 회선 위임 인증",
	},
	"화면 구성": [
		{ "섹션 번호": 0, "섹션 명": "AppBarSection", "섹션 유형": "static", "섹션 설명": "상단 네비" },
		{
			"섹션 번호": 2,
			"섹션 명": "PayMethodBatchSection",
			"섹션 유형": "dynamic",
			"섹션 설명": "납부수단 통합 조회",
			"노출 개수 (최소)": 1,
			"노출 개수 (최대)": "N",
			"오류 처리 방식": "오류 항목 미노출",
		},
		{ "섹션 번호": 999, "섹션 명": "ActionButtonSection", "섹션 유형": "static", "섹션 설명": "하단 CTA" },
	],
	"컴포넌트 상세": [
		{
			"섹션 명": "AppBarSection",
			"컴포넌트 명": "AppBarHeader",
			"컴포넌트 ID": "AppBar",
			variant: null,
			state: "Default",
			"props (초기 데이터)": {
				PageTitle: { kind: "literal", value: "가족 회선 위임 인증" },
				showBack: { kind: "literal", value: "true" },
			},
		},
		{
			"섹션 명": "PayMethodBatchSection",
			"컴포넌트 명": "ListTextDelegationLine2",
			"컴포넌트 ID": "ListText",
			variant: "FirstTitle",
			state: "Default",
			"props (초기 데이터)": {
				Title: { kind: "binding", value: "회선명", sample: "010-1234-5678" },
				Subtitle: { kind: "binding", value: "청구금액", sample: "55,000원" },
			},
		},
		{
			"섹션 명": "ActionButtonSection",
			"컴포넌트 명": "ActionButtonApply",
			"컴포넌트 ID": "ActionButton",
			variant: "Default",
			state: "Default",
			"props (초기 데이터)": { Label: { kind: "literal", value: "적용하고 다음" } },
		},
	],
	"화면 동작": [{ 소스: "ActionButtonApply", 이벤트: "onClick", 액션: "navigate" }],
});

describe("@cx/adapters/json", () => {
	it("maps PRDD JSON into a SourceSpec shape with the json sourceKind", () => {
		const result = parseJsonSourceBundle({
			importId: "BIL",
			receivedAt: "2026-06-15T00:00:00.000Z",
			path: "data/client-imports/BIL/NC-BIL-PU-021-0.json",
			content: SAMPLE,
		});

		expect(result.ok).toBe(true);
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec).toMatchObject({
			schemaVersion: "source-spec.v0.1",
			sourceImport: { importId: "BIL", sourceKind: "json" },
			sourceShape: {
				screen: {
					screenCode: "NC-BIL-PU-021-0",
					name: "가족 회선 위임 인증",
					// breadcrumb 경로는 route가 아니므로 screenCode로 생성한다.
					route: "/nc/bil/pu/021/0",
				},
			},
		});
	});

	it("places sections by number into header/contents/bottom slots", () => {
		const result = parseJsonSourceBundle({ importId: "BIL", content: SAMPLE });
		if (!result.ok) throw new Error("parse failed");
		expect(result.sourceSpec.sourceShape.screen.regions.map((region) => region.slot)).toEqual([
			"header",
			"contents",
			"bottom",
		]);
	});

	it("keeps literal props typed and preserves bindings + state + raw props", () => {
		const result = parseJsonSourceBundle({ importId: "BIL", content: SAMPLE });
		if (!result.ok) throw new Error("parse failed");
		const components = result.sourceSpec.sourceShape.screen.regions.flatMap((region) =>
			region.children.flatMap((area) => area.children),
		);

		const appBar = components.find((component) => component.sourceComponentId === "AppBar");
		expect(appBar?.props).toEqual({ PageTitle: "가족 회선 위임 인증", showBack: true });
		expect(appBar?.raw?.note).toBe("state: Default");

		const listText = components.find((component) => component.sourceComponentId === "ListText");
		// binding은 typed props로 올라오지 않고 raw.bindingSource로 보존된다.
		expect(listText?.props).toBeUndefined();
		expect(listText?.raw?.bindingSource).toBe("Title←회선명, Subtitle←청구금액");
		// 원본 props는 2단계 복원을 위해 raw.propsText에 무손실로 직렬화된다.
		expect(JSON.parse(listText?.raw?.propsText ?? "{}").Title.sample).toBe("010-1234-5678");
	});

	it("carries dynamic area metadata (type/min/max/errorPolicy)", () => {
		const result = parseJsonSourceBundle({ importId: "BIL", content: SAMPLE });
		if (!result.ok) throw new Error("parse failed");
		const contents = result.sourceSpec.sourceShape.screen.regions.find(
			(region) => region.slot === "contents",
		);
		const area = contents?.children[0];
		expect(area).toMatchObject({
			areaType: "dynamic",
			minCount: "1",
			maxCount: "N",
			errorPolicy: "오류 항목 미노출",
		});
	});

	it("reports invalid JSON as an error", () => {
		const result = parseJsonSourceBundle({ importId: "x", content: "{ not json" });
		expect(result.ok).toBe(false);
		expect(result.issues).toContainEqual(
			expect.objectContaining({ code: "invalid-json", severity: "error" }),
		);
	});

	it("reports missing 메타데이터 as an error", () => {
		const result = parseJsonSourceBundle({ importId: "x", content: JSON.stringify({ "화면 구성": [] }) });
		expect(result.ok).toBe(false);
		expect(result.issues).toContainEqual(
			expect.objectContaining({ code: "missing-metadata", severity: "error" }),
		);
	});
});
