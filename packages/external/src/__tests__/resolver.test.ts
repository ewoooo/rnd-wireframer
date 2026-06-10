import { describe, expect, it } from "vitest";
import { textPropSourceKeys } from "../catalog.text-sources";
import {
	componentCatalog,
	getComponentCatalogEntry,
	getComponentCatalogStatus,
	getComponentCatalogTypes,
	getTextPropSourceKeys,
	listCandidateComponentEntries,
	resolveComponentCatalogForInference,
} from "../resolver";

const BARREL_KEY = "kiki.AppBar"; // kiki-barrel
const DRAFT_KEY = "kiki.BadgeHome"; // kiki-draft

describe("@cx/external resolver", () => {
	it("kiki.X 키로 엔트리를 직접 조회한다", () => {
		expect(getComponentCatalogEntry(BARREL_KEY)?.type).toBe(BARREL_KEY);
		expect(getComponentCatalogEntry("does.not.exist")).toBeUndefined();
	});

	it("barrel은 stable, draft는 candidate로 status를 유도한다", () => {
		expect(getComponentCatalogStatus(BARREL_KEY)).toBe("stable");
		expect(getComponentCatalogStatus(DRAFT_KEY)).toBe("candidate");
		expect(getComponentCatalogStatus("does.not.exist")).toBeUndefined();
	});

	it("listCandidateComponentEntries는 draft만 반환한다", () => {
		const candidates = listCandidateComponentEntries();
		expect(candidates.length).toBeGreaterThan(0);
		expect(candidates.every((e) => e.source === "kiki-draft")).toBe(true);
	});

	it("getComponentCatalogTypes는 정렬된 키 목록", () => {
		const types = getComponentCatalogTypes();
		expect(types).toContain(BARREL_KEY);
		expect([...types]).toEqual([...types].sort());
	});

	it("componentCatalog는 externalCatalog와 동일 형상", () => {
		expect(componentCatalog[BARREL_KEY]?.type).toBe(BARREL_KEY);
	});

	it("inference 공급 owner는 @cx/external", () => {
		const obj = resolveComponentCatalogForInference();
		expect(obj.owner).toBe("@cx/external");
		expect(obj.kind).toBe("component-catalog");
		expect(obj.data.entries.length).toBeGreaterThan(0);
	});

	it("getTextPropSourceKeys는 등록 prop이면 후보 순서를, 미등록이면 자기 자신만 반환한다", () => {
		expect(getTextPropSourceKeys("title")).toEqual(["title", "titleText", "titleLabel", "main"]);
		expect(getTextPropSourceKeys("unknownProp")).toEqual(["unknownProp"]);
	});

	it("텍스트 소스 테이블의 모든 키는 catalog 엔트리의 실제 prop 키다", () => {
		const knownPropKeys = new Set(
			Object.values(componentCatalog).flatMap((entry) => Object.keys(entry.props)),
		);
		for (const key of Object.keys(textPropSourceKeys)) {
			expect(knownPropKeys.has(key), `dead text-source key: ${key}`).toBe(true);
		}
	});

	it("모든 텍스트 소스 후보 목록은 키 자신을 첫 후보로 둔다", () => {
		for (const [key, sources] of Object.entries(textPropSourceKeys)) {
			expect(sources[0], `${key}의 첫 후보는 자기 자신이어야 함`).toBe(key);
		}
	});
});
