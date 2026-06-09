import { describe, expect, it } from "vitest";
import {
	componentCatalog,
	getComponentCatalogEntry,
	getComponentCatalogStatus,
	getComponentCatalogTypes,
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
});
