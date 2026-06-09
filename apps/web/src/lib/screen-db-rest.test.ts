import { describe, expect, it } from "vitest";
import { inFilter } from "./screen-db-rest";

describe("screen-db-rest", () => {
	it("quotes PostgREST in-filter values so ids cannot break the filter list", () => {
		expect(inFilter(["screen-1", "area,2", 'component"3'])).toBe(
			'in.("screen-1","area,2","component\\"3")',
		);
	});
});
